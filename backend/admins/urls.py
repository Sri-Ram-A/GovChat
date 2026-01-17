from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from .views import complaints, create

urlpatterns = [
    path("jurisdictions/", create.JurisdictionAPIView.as_view()),
    path("domains/", create.DomainAPIView.as_view()),
    path("departments/", create.DepartmentAPIView.as_view()),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', create.AdminRegistrationAPIView.as_view(), name='citizen-register'),
    path('login/', create.AdminLoginAPIView.as_view(), name='citizen-register'),
    path('', create.AdminListAPIView.as_view(), name='admin-list'),

    path("complaints/",complaints.AdminDepartmentComplaintsAPIView.as_view()),


    path('geo/', complaints.GeoTestAPIView.as_view()), 
]
