from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from inventory.views import CustomTokenObtainPairView
from django.http import HttpResponse 

def home(request):
    return HttpResponse("<h1>Warehouse Management System</h1><p>API is working fine.</p>") 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),  
    path('api/', include('inventory.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
