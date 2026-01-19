from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404

from entities.handlers import HandlerProfile 
import serializer.base as base_serializer
import  serializer.handlers as handler_serializer
from entities.governance import Department
from entities.complaints import ComplaintGroup
from serializer.complaints import ParticularComplaintGroupSerializer
class HandlerListAPIView(APIView):
    serializer_class = handler_serializer.HandlerProfileSerializer
    
    def get(self, request):
        admins = (HandlerProfile.objects.select_related('user', 'department').all())
        serializer = self.serializer_class(admins, many=True)
        return Response(serializer.data)
    
class HandlerRegistrationAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = handler_serializer.HandlerRegistrationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Registration successful"},
            status=status.HTTP_201_CREATED
        )


class HandlerLoginAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = base_serializer.UserLoginSerializer # Very helpful for drf-spectacular to infer the required inputs
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user) # type: ignore
        return Response({"access": str(refresh.access_token),"refresh": str(refresh),}, status=status.HTTP_200_OK)
    
class HandlerDepartmentListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = handler_serializer.HandlerDepartmentsSerializer

    def get(self, request):
        handler = request.user.admin_profile
        department = handler.department

        if not department:
            return Response(
                {"message": "Handler is not assigned to any department"},
                status=400
            )

        handlers = (
            HandlerProfile.objects
            .select_related("user", "group")
            .filter(department=department)
        )

        serializer = self.serializer_class(handlers, many=True)
        return Response(serializer.data)

class AssignGroupToHandlerAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = handler_serializer.HandlerDepartmentsSerializer

    def post(self, request, handler_id):
        handler = get_object_or_404(HandlerProfile, id=handler_id)
        group_id = request.data.get("group_id")
        if not group_id:
            return Response(
                {"message": "group_id is required"},
                status=400
            )
        group = get_object_or_404(ComplaintGroup, id=group_id)
        handler.group = group
        handler.save(update_fields=["group"])
        return Response({
            "message": "Group assigned successfully",
            "handler_id": handler.id,
            "group_id": group.id,
        })

class MyAssignedGroupAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ParticularComplaintGroupSerializer

    def get(self, request):
        handler = request.user.handler_profile
        if not handler.group:
            return Response(
                {"message": "No group assigned"},
                status=200
            )
        serializer = self.serializer_class(handler.group)
        return Response(serializer.data)
