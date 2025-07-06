from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('operator', 'Operator'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='operator')

class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    tags = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    performed_by = models.CharField(max_length=255, default='System')  

    def __str__(self):
        return f"{self.performed_by} {self.action} {self.product.name} on {self.timestamp}"
    
class InboundTransaction(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    supplier = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    invoice_reference = models.CharField(max_length=100, blank=True)
    received_date = models.DateField()
    attachment = models.FileField(upload_to='inbound_files/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inbound {self.product.name} - {self.quantity} units"

class OutboundTransaction(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    customer = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    so_reference = models.CharField(max_length=100, blank=True)  # SO = Sales Order
    dispatch_date = models.DateField()
    attachment = models.FileField(upload_to='outbound_files/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Outbound {self.product.name} - {self.quantity} units"

class CycleCount(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    counted_quantity = models.PositiveIntegerField()
    system_quantity = models.PositiveIntegerField()
    discrepancy = models.IntegerField()
    reason = models.TextField(blank=True)
    adjusted = models.BooleanField(default=False)
    counted_by = models.CharField(max_length=255, default="admin")
    counted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - Counted"
    
    
