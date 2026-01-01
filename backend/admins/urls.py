from django.urls import path
from . import views 

urlpatterns = [
    path('', views.AdminListAPIView.as_view(), name='citizen-list'),
]
