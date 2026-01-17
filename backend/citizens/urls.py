from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from . import views 

urlpatterns = [
    path('', views.CitizenListAPIView.as_view(), name='citizen-list'),
    path('register/', views.CitizenRegistrationAPIView.as_view(), name='citizen-register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', views.CitizenLoginAPIView.as_view(), name='citizen-register'),

    path("ai/caption_image/", views.ImageCaptionAPIView.as_view()),
    path("ai/resolve_location/", views.ResolveLocationAPIView.as_view()),
    path("complaints/", views.ComplaintCreateAPIView.as_view()),
    path("upload_evidence/<int:complaint_id>/",views.EvidenceUploadAPIView.as_view(),),


    path("complaints/all/", views.AllComplaintsView.as_view()),


]
