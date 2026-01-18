from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from .views import create,complaints

urlpatterns = [
    path('', create.CitizenListAPIView.as_view(), name='citizen-list'),
    path('register/', create.CitizenRegistrationAPIView.as_view(), name='citizen-register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', create.CitizenLoginAPIView.as_view(), name='citizen-register'),

    path("ai/caption_image/", complaints.ImageCaptionAPIView.as_view()),
    path("ai/resolve_location/", complaints.ResolveLocationAPIView.as_view()),
    path("complaints/", complaints.ComplaintCreateAPIView.as_view()),
    path("upload_evidence/<int:complaint_id>/",
         complaints.EvidenceCreateAPIView.as_view(),),


    path("complaints/all/", complaints.AllComplaintsView.as_view()),


]
