from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from . import views 

urlpatterns = [
    path('', views.AdminListAPIView.as_view(), name='citizen-list'),
    # path('register/', views.CitizenRegistrationAPIView.as_view(), name='citizen-register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('login/', views.CitizenLoginAPIView.as_view(), name='citizen-register'),
    path('departments/',views.DepartmentsListAPIView.as_view(),name='department-list'),
    path("jurisdiction/",views.AllJurisdictionView.as_view()),
     path('geo/', views.GeoTestAPIView.as_view()), 
]
