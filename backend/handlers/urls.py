from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("register/", views.HandlerRegistrationAPIView.as_view(), name="handler-register"),
    path("login/", views.HandlerLoginAPIView.as_view(), name="handler-login"),

    # Admin-facing: list all handlers, list by department
    path("", views.HandlerListAPIView.as_view(), name="all-handler-list"),
    path("department/", views.HandlerDepartmentListAPIView.as_view(), name="handler-department-list"),

    # Admin-facing: assign a group to a specific handler
    path("<int:handler_id>/assign-group/", views.AssignGroupToHandlerAPIView.as_view(), name="handler-assign-group"),

    # Handler-facing: view own assigned group
    path("assigned-group/", views.MyAssignedGroupAPIView.as_view(), name="handler-assigned-group"),

    # Handler-facing: post a timeline update for their assigned group
    path("timeline/", views.HandlerGroupTimelineCreateAPIView.as_view(), name="handler-timeline-create"),

    # Handler-facing: view all complaints in their group
    path("group-complaints/", views.HandlerGroupComplaintsAPIView.as_view(), name="handler-group-complaints"),

    # Handler-facing: upload evidence image for a complaint
    path("complaints/<int:complaint_id>/evidence/", views.HandlerUploadEvidenceAPIView.as_view(), name="handler-upload-evidence"),
]