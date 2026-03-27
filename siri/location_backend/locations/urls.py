from django.urls import path
from .views import get_service_locations

urlpatterns = [
    path('locations/', get_service_locations, name='get_service_locations'),
]
