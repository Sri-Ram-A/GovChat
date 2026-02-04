# Add to handlers/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.HandlerRegistrationAPIView.as_view(), name='handler-register'),
    path('login/', views.HandlerLoginAPIView.as_view(), name='handler-login'),
    path('', views.HandlerListAPIView.as_view(), name='all-handler-list'),
    path('department/', views.HandlerDepartmentListAPIView.as_view(), name='handler-list'),
    path('<int:handler_id>/assign-group/', views.AssignGroupToHandlerAPIView.as_view(), name='assign-group'),
    path('assigned-group/', views.MyAssignedGroupAPIView.as_view(), name='assigned-group'),
    path('timeline/', views.HandlerTimelineAPIView.as_view(), name='handler-timeline'),  # NEW
]