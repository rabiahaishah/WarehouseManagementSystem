from rest_framework import serializers
from .models import Product, AuditLog
from .models import InboundTransaction, OutboundTransaction
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'product', 'product_name', 'action', 'performed_by', 'timestamp']

class InboundTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InboundTransaction
        fields = '__all__'

class OutboundTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutboundTransaction
        fields = '__all__'

from .models import CycleCount

class CycleCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = CycleCount
        fields = '__all__'

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'username': self.user.username,
            'role': self.user.role  
        }

        data['access'] = str(self.get_token(self.user).access_token)
        data['refresh'] = str(self.get_token(self.user))

        return data