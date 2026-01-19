from django.urls import path
from . import views
urlpatterns = [
    path('register/', views.HandlerRegistrationAPIView.as_view(), name='handler-register'),
    path('login/', views.HandlerLoginAPIView.as_view(), name='handler-login'),
    path('', views.HandlerListAPIView.as_view(), name='handler-list'),
]
