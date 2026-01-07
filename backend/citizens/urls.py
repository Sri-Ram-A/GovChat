from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from . import views 

urlpatterns = [
    path('', views.CitizenListAPIView.as_view(), name='citizen-list'),
    path('register/', views.CitizenRegistrationAPIView.as_view(), name='citizen-register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', views.CitizenLoginAPIView.as_view(), name='citizen-register'),
    path("complaints/", views.CitizenComplaintView.as_view()),
    path("complaints/all/", views.AllComplaintsView.as_view()),
    path("evidence/upload/",views.EvidenceUploadView.as_view(),name="evidence-upload")
]
