from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from entities.handlers import HandlerProfile
import serializer.base as base_serializer
import serializer.handlers as handler_serializer
from entities.complaints import ComplaintGroup
from serializer.complaints import ParticularComplaintGroupSerializer
import entities.complaints as complaints_entity
import serializer.complaints as complaints_serializer


class HandlerListAPIView(APIView):
    serializer_class = handler_serializer.HandlerProfileSerializer

    def get(self, request):
        admins = HandlerProfile.objects.select_related("user", "department").all()
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
            {"message": "Registration successful"}, status=status.HTTP_201_CREATED
        )


class HandlerLoginAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = (
        base_serializer.UserLoginSerializer
    )  # Very helpful for drf-spectacular to infer the required inputs

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)  # type: ignore
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class HandlerDepartmentListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = handler_serializer.HandlerDepartmentsSerializer

    def get(self, request):
        handler = request.user.admin_profile
        department = handler.department

        if not department:
            return Response(
                {"message": "Handler is not assigned to any department"}, status=400
            )

        handlers = HandlerProfile.objects.select_related("user", "group").filter(
            department=department
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
            return Response({"message": "group_id is required"}, status=400)
        group = get_object_or_404(ComplaintGroup, id=group_id)
        handler.group = group
        handler.save(update_fields=["group"])
        return Response(
            {
                "message": "Group assigned successfully",
                "handler_id": handler.id,
                "group_id": group.id,
            }
        )


class MyAssignedGroupAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ParticularComplaintGroupSerializer

    def get(self, request):
        handler = request.user.handler_profile
        if not handler.group:
            return Response({"message": "No group assigned"}, status=200)
        serializer = self.serializer_class(handler.group)
        return Response(serializer.data)


class HandlerGroupComplaintsAPIView(APIView):
    """
    GET /handlers/group-complaints/

    Returns all complaints belonging to the group assigned to this handler.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            handler = request.user.handler_profile
        except AttributeError:
            return Response(
                {"message": "No handler profile found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not handler.group:
            return Response(
                {"message": "No group assigned"},
                status=status.HTTP_200_OK,
            )

        complaints = (
            complaints_entity.Complaint.objects.filter(group=handler.group)
            .select_related("citizen", "department")
            .prefetch_related("evidences")
        )
        serializer = complaints_serializer.ComplaintListSerializer(
            complaints, many=True
        )
        return Response(serializer.data)


class HandlerUploadEvidenceAPIView(APIView):
    """
    POST /handlers/complaints/{complaint_id}/evidence/

    Allows a handler to upload an image as evidence for a complaint
    in their assigned group. Accepts multipart/form-data.

    Fields:
        file        — image file (required)
        media_type  — e.g. "IMAGE" (required)
        caption     — short description (optional)
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, complaint_id):
        try:
            handler = request.user.handler_profile
        except AttributeError:
            return Response(
                {"detail": "No handler profile found"},
                status=status.HTTP_403_FORBIDDEN,
            )

        complaint = get_object_or_404(complaints_entity.Complaint, id=complaint_id)
        # Ensure the complaint belongs to the handler's assigned group
        if not handler.group or complaint.group_id != handler.group_id:
            return Response(
                {"detail": "This complaint is not in your assigned group"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if complaint.status in ["CLOSED", "RESOLVED"]:
            return Response(
                {"detail": "Cannot upload evidence to a closed or resolved complaint"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = complaints_serializer.HandlerEvidenceCreateSerializer(
            data=request.data,
            context={"request": request, "complaint": complaint},
        )
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save()
        return Response(
            {"id": evidence.id, "message": "Evidence uploaded successfully"},
            status=status.HTTP_201_CREATED,
        )


class HandlerGroupTimelineCreateAPIView(APIView):
    """
    POST /handlers/timeline/

    Allows a handler to post a timeline update for their assigned group.
    Mirrors GroupTimelineCreateAPIView but uses handler_profile context.
    Accepts multipart/form-data so an image can be attached.

    Fields:
        group   — ComplaintGroup pk (required)
        title   — short headline (required)
        text    — body text (required)
        image   — image file (optional)
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            _ = request.user.handler_profile
        except AttributeError:
            return Response(
                {"detail": "No handler profile found"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = complaints_serializer.GroupTimelineCreateByHandlerSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        timeline = serializer.save()
        return Response(
            {"id": timeline.id, "message": "Timeline created"},
            status=status.HTTP_201_CREATED,
        )

    """
    GET /handlers/group-complaints/
 
    Returns all complaints belonging to the group assigned to this handler.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            handler = request.user.handler_profile
        except AttributeError:
            return Response(
                {"message": "No handler profile found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not handler.group:
            return Response(
                {"message": "No group assigned"},
                status=status.HTTP_200_OK,
            )

        complaints = (
            complaints_entity.Complaint.objects.filter(group=handler.group)
            .select_related("citizen", "department")
            .prefetch_related("evidences")
        )
        serializer = complaints_serializer.ComplaintListSerializer(
            complaints, many=True
        )
        return Response(serializer.data)
