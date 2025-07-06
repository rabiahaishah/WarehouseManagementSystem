from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import Product, AuditLog, User

# Extend default UserAdmin to include 'role'
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Role & Permissions", {"fields": ("role",)}),
    )
    list_display = ["username", "email", "role", "is_staff"]
    list_filter = ["role", "is_staff", "is_superuser"]

admin.site.register(Product)
admin.site.register(AuditLog)


