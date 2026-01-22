from django.urls import path
from .views import create,complaints

urlpatterns = [
    path('', create.CitizenListAPIView.as_view(), name='citizen-list'),
    path('register/', create.CitizenRegistrationAPIView.as_view(), name='citizen-register'),
    path('login/', create.CitizenLoginAPIView.as_view(), name='citizen-register'),

    path("ai/caption_image/", complaints.ImageCaptionAPIView.as_view()),
    path("ai/resolve_location/", complaints.ResolveLocationAPIView.as_view()),
    path("complaints/", complaints.ComplaintCreateAPIView.as_view()),
    path("complaint-groups/status/<int:group_id>/",complaints.CitizenComplaintGroupStatus.as_view()),
    path("complaints/my/", complaints.MyComplaintsView.as_view()),
    path("upload_evidence/<int:complaint_id>/",complaints.EvidenceCreateAPIView.as_view(),),


    path("complaints/all/", complaints.AllComplaintsView.as_view()),


]
