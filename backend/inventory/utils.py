from .models import AuditLog

def log_audit(product, action, user=None):
    username = 'System'
    if user and hasattr(user, 'username'):
        username = user.username

    AuditLog.objects.create(
        product=product,
        action=action,
        performed_by=username
    )
