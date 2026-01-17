from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from .views import create ,views

urlpatterns = [
    path('', create.AdminListAPIView.as_view(), name='citizen-list'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path("jurisdictions/", create.JurisdictionAPIView.as_view()),
    path("domains/", create.DomainAPIView.as_view()),
    path("departments/", create.DepartmentAPIView.as_view()),

    path('register/', views.AdminRegistrationAPIView.as_view(), name='citizen-register'),
    path('login/', views.AdminLoginAPIView.as_view(), name='citizen-register'),

     path('geo/', views.GeoTestAPIView.as_view()), 
]
