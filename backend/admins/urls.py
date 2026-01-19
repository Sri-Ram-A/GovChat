from django.urls import path
from .views import complaints, create

urlpatterns = [
    path("jurisdictions/", create.JurisdictionAPIView.as_view()),
    path("domains/", create.DomainAPIView.as_view()),
    path("departments/", create.DepartmentAPIView.as_view()),

    path('register/', create.AdminRegistrationAPIView.as_view(), name='admin-register'),
    path('login/', create.AdminLoginAPIView.as_view(), name='admin-login'),
    path('', create.AdminListAPIView.as_view(), name='admin-list'),

    path("complaints/",complaints.DepartmentListComplaints.as_view()),
    path("complaint-groups/",complaints.DepartmentListComplaintGroups.as_view()),
    path("complaint-groups/<int:group_id>/",complaints.ParticularComplaintGroup.as_view()),
    path("complaint-groups/status/<int:group_id>/",complaints.ResolveComplaintGroupStatus.as_view()),
    path("complaint/<int:complaint_id>/",complaints.ComplaintDetailedView.as_view()),
    path("timeline/",complaints.GroupTimelineCreateAPIView.as_view()),

    path('geo/', complaints.GeoTestAPIView.as_view()), 
]
