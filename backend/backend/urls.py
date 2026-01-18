"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# https://medium.com/@ukemeboswilson/creating-swagger-documentation-in-django-rest-framework-a-guide-to-drf-yasg-and-drf-spectacular-216fc41d47de

from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda request: HttpResponse("Welcome to my API! Explore the endpoints."), name='welcome'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema')),
    path('schema-viewer/', include('schema_viewer.urls')),

    path("api/citizens/", include("citizens.urls")),
    path("api/admins/", include("admins.urls")),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
