from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, ProductBulkUploadView, AuditLogViewSet,
    InboundTransactionViewSet, InboundBulkUploadView,
    OutboundTransactionViewSet, OutboundBulkUploadView,
    dashboard_summary, daily_transaction_volume, CycleCountViewSet,
    generate_barcode, generate_qrcode, forecast_stock
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'audit-log', AuditLogViewSet, basename='auditlog')
router.register(r'inbounds', InboundTransactionViewSet)
router.register(r'outbounds', OutboundTransactionViewSet)
router.register(r'cycle-counts', CycleCountViewSet)

urlpatterns = [
    # API routers
    path('', include(router.urls)),

    # Bulk upload endpoints
    path('upload-products/', ProductBulkUploadView.as_view(), name='product-upload'),
    path('upload-inbounds/', InboundBulkUploadView.as_view(), name='inbound-upload'),
    path('upload-outbounds/', OutboundBulkUploadView.as_view(), name='outbound-upload'),

    # Dashboard and analytics
    path('dashboard-summary/', dashboard_summary, name='dashboard-summary'),
    path('daily-transactions/', daily_transaction_volume, name='daily-transactions'),

    # Barcode/QR
    path('products/<str:sku>/barcode/', generate_barcode, name='generate-barcode'),
    path('products/<str:sku>/qrcode/', generate_qrcode, name='generate-qrcode'),

    # Forecast
    path('forecast/<str:sku>/', forecast_stock, name='forecast-stock'),
]
