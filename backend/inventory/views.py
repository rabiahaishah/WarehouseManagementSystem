from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from django.db import models
from django.db.models import F, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from io import StringIO, BytesIO
import csv
import barcode
from barcode.writer import ImageWriter
import qrcode
import pandas as pd
from datetime import datetime

from .permissions import IsAdmin, IsManager, IsOperator
from .utils import log_audit
from .models import (
    Product, 
    InboundTransaction, OutboundTransaction,
    CycleCount, AuditLog
)
from .serializers import (
    ProductSerializer, AuditLogSerializer,
    InboundTransactionSerializer, OutboundTransactionSerializer,
    CycleCountSerializer,
    CustomTokenObtainPairSerializer
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
# -----------------------
# Product CRUD + Bulk Upload
# -----------------------

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'category', 'tags']
    ordering_fields = ['name', 'quantity']
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        product = serializer.save()
        log_audit(product, 'create', self.request.user)

    def perform_update(self, serializer):
        product = serializer.save()
        log_audit(product, 'update', self.request.user)

    def perform_destroy(self, instance):
        log_audit(instance, 'delete', self.request.user)
        instance.delete()

    def get_queryset(self):
        qs = Product.objects.all()
        if self.request.query_params.get('low_stock') == 'true':
            qs = qs.filter(quantity__lte=F('low_stock_threshold'))

        is_archived = self.request.query_params.get('is_archived')
        if is_archived == 'true':
            qs = qs.filter(is_archived=True)
        elif is_archived == 'false':
            qs = qs.filter(is_archived=False)

        return qs

class ProductBulkUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        decoded_file = file.read().decode('utf-8')
        reader = csv.DictReader(StringIO(decoded_file))

        products = [
            Product(
                name=row['name'],
                sku=row['sku'],
                tags=row.get('tags', ''),
                description=row.get('description', ''),
                category=row.get('category', ''),
                quantity=int(row['quantity']),
                low_stock_threshold=int(row.get('low_stock_threshold', 10)),
                is_archived=False  
            ) for row in reader
        ]
        Product.objects.bulk_create(products)
        return Response({'message': 'Bulk upload successful'})

# -----------------------
# Audit Logs
# -----------------------

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AuditLog.objects.all().order_by('-timestamp')
        product_id = self.request.query_params.get('product_id')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

# -----------------------
# Inbound Transactions
# -----------------------

class InboundTransactionViewSet(viewsets.ModelViewSet):
    queryset = InboundTransaction.objects.all().order_by('-created_at')
    serializer_class = InboundTransactionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        inbound = serializer.save()
        inbound.product.quantity += inbound.quantity
        inbound.product.save()
        log_audit(inbound.product, 'update', self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_quantity = instance.quantity
        old_product = instance.product

        updated = serializer.save()

        if old_product != updated.product:
            old_product.quantity -= old_quantity
            old_product.save()

            updated.product.quantity += updated.quantity
            updated.product.save()
        else:
            delta = updated.quantity - old_quantity
            updated.product.quantity += delta
            updated.product.save()

        log_audit(updated.product, 'update', self.request.user)

    def perform_destroy(self, instance):
        product = instance.product
        product.quantity -= instance.quantity
        product.save()
        log_audit(product, 'update', self.request.user)
        instance.delete()

class InboundBulkUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        decoded_file = file.read().decode('utf-8')
        reader = csv.DictReader(StringIO(decoded_file))

        for row in reader:
            try:
                product = Product.objects.get(sku=row['sku'])

                inbound = InboundTransaction.objects.create(
                    product=product,
                    supplier=row.get('supplier', ''),
                    quantity=int(row['quantity']),
                    invoice_reference=row.get('invoice_reference', ''),
                    received_date=datetime.strptime(row['received_date'], "%m/%d/%Y").date()
                )
                product.quantity += inbound.quantity
                product.save()
                log_audit(product, 'update', request.user if request.user.is_authenticated else None)
            except Product.DoesNotExist:
                continue 

        return Response({'message': 'Bulk inbound upload successful'})


# -----------------------
# Outbound Transactions
# -----------------------

class OutboundTransactionViewSet(viewsets.ModelViewSet):
    queryset = OutboundTransaction.objects.all().order_by('-created_at')
    serializer_class = OutboundTransactionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        outbound = serializer.save()
        product = outbound.product

        if outbound.quantity > product.quantity:
            raise ValidationError(f"Cannot dispatch {outbound.quantity} items. Only {product.quantity} in stock.")

        product.quantity -= outbound.quantity
        product.save()
        log_audit(product, 'update', self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_quantity = instance.quantity
        old_product = instance.product

        updated = serializer.save()

        if old_product != updated.product:
            old_product.quantity += old_quantity
            old_product.save()

            if updated.quantity > updated.product.quantity:
                raise ValidationError(f"Cannot dispatch {updated.quantity}. Only {updated.product.quantity} in stock.")
            updated.product.quantity -= updated.quantity
            updated.product.save()
        else:
            delta = updated.quantity - old_quantity
            if delta > updated.product.quantity:
                raise ValidationError(f"Cannot dispatch additional {delta}. Only {updated.product.quantity} in stock.")
            updated.product.quantity -= delta
            updated.product.save()

        log_audit(updated.product, 'update', self.request.user)

    def perform_destroy(self, instance):
        product = instance.product
        product.quantity += instance.quantity
        product.save()
        log_audit(product, 'update', self.request.user)
        instance.delete()

class OutboundBulkUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        decoded_file = file.read().decode('utf-8')
        reader = csv.DictReader(StringIO(decoded_file))

        for row in reader:
            try:
                product = Product.objects.get(sku=row['sku'])
                qty = int(row['quantity'])

                if qty > product.quantity:
                    continue

                outbound = OutboundTransaction.objects.create(
                    product=product,
                    customer=row['customer'],
                    quantity=qty,
                    so_reference=row.get('so_reference', ''),
                    dispatch_date=datetime.strptime(row['dispatch_date'], "%m/%d/%Y").date()
                )
                product.quantity -= qty
                product.save()
                log_audit(product, 'update', request.user if request.user.is_authenticated else None)
            except Product.DoesNotExist:
                continue

        return Response({'message': 'Bulk outbound upload successful'})

# -----------------------
# Forecasting + Dashboard
# -----------------------

@api_view(['GET'])
def dashboard_summary(request):
    today = timezone.now().date()
    total_products = Product.objects.count()
    inbound_today = InboundTransaction.objects.filter(received_date=today).aggregate(total=Sum('quantity'))['total'] or 0
    outbound_today = OutboundTransaction.objects.filter(dispatch_date=today).aggregate(total=Sum('quantity'))['total'] or 0
    low_stock_count = Product.objects.filter(quantity__lte=models.F('low_stock_threshold')).count()

    recent_activities = AuditLog.objects.all().order_by('-timestamp')[:10]
    recent_data = [
        {
            'product': a.product.name,
            'action': a.action,
            'performed_by': a.performed_by,
            'timestamp': a.timestamp
        } for a in recent_activities
    ]

    return Response({
        'total_products': total_products,
        'inbound_today': inbound_today,
        'outbound_today': outbound_today,
        'low_stock_alerts': low_stock_count,
        'recent_activities': recent_data
    })

@api_view(['GET'])
def daily_transaction_volume(request):
    inbound = InboundTransaction.objects.annotate(date=TruncDate('received_date')).values('date').annotate(total=Sum('quantity')).order_by('date')
    outbound = OutboundTransaction.objects.annotate(date=TruncDate('dispatch_date')).values('date').annotate(total=Sum('quantity')).order_by('date')

    return Response({
        'inbound': list(inbound),
        'outbound': list(outbound)
    })

@api_view(['GET'])
def forecast_stock(request, sku):
    try:
        product = Product.objects.get(sku=sku)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    data = OutboundTransaction.objects.filter(product=product).values('dispatch_date', 'quantity')
    if not data:
        return Response({"message": "Not enough data to forecast"}, status=400)

    df = pd.DataFrame(list(data))
    df['dispatch_date'] = pd.to_datetime(df['dispatch_date'])
    df = df.groupby('dispatch_date').sum().resample('D').sum().fillna(0)
    df['rolling_avg'] = df['quantity'].rolling(window=7, min_periods=1).mean()

    current_stock = product.quantity
    avg_daily_use = df['rolling_avg'].iloc[-1]

    if avg_daily_use == 0:
        return Response({
            "sku": product.sku,
            "product": product.name,
            "stock": current_stock,
            "daily_average": 0,
            "forecast_days_left": "∞ (no usage)"
        })

    days_left = int(current_stock / avg_daily_use)
    return Response({
        "sku": product.sku,
        "product": product.name,
        "stock": current_stock,
        "daily_average": round(avg_daily_use, 2),
        "forecast_days_left": days_left
    })

# -----------------------
# Cycle Count
# -----------------------

class CycleCountViewSet(viewsets.ModelViewSet):
    queryset = CycleCount.objects.all().order_by('-counted_at')
    serializer_class = CycleCountSerializer

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        counted = serializer.validated_data['counted_quantity']
        system = product.quantity
        discrepancy = counted - system
        counted_by = self.request.user.username if self.request.user.is_authenticated else 'admin'

        serializer.save(
            system_quantity=system,
            discrepancy=discrepancy,
            counted_by=counted_by
        )

        if discrepancy != 0:
            product.quantity = counted
            product.save()

# -----------------------
# Barcode / QR Code
# -----------------------

@api_view(['GET'])
def generate_barcode(request, sku):
    buffer = BytesIO()
    bcode = barcode.get_barcode_class('code128')(sku, writer=ImageWriter())
    bcode.write(buffer)
    buffer.seek(0)
    return HttpResponse(buffer, content_type='image/png')

@api_view(['GET'])
def generate_qrcode(request, sku):
    qr = qrcode.make(sku)
    buffer = BytesIO()
    qr.save(buffer, format='PNG')
    buffer.seek(0)
    return HttpResponse(buffer, content_type='image/png')
