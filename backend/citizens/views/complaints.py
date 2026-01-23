from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.authentication import JWTAuthentication

import serializer.complaints as complaints_serializer
from entities.complaints import Complaint
from citizens import helper
import entities.complaints as complaints_entity


class AllComplaintsView(APIView):
    serializer_class = complaints_serializer.ComplaintListSerializer

    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = self.serializer_class(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ImageCaptionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.ImageCaptionSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data.get("file",None)
        caption, dept_name, confidence = helper.analyze_image(file)
        department = helper.get_or_create_department(dept_name)
        return Response({
            "caption": caption,
            "suggested_department": {
                "id": department.id,
                "name": department.name
            },
            "confidence": confidence
        })

class ResolveLocationAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ResolveLocationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        lat = serializer.validated_data.get("latitude")
        lon = serializer.validated_data.get("longitude")

        location = helper.resolve_location(lat, lon)
        return Response(location)


class ComplaintCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintCreateSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data,context={"request": request})
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()
        return Response(
            {"id": complaint.id, "message": "Complaint created"},
            status=status.HTTP_201_CREATED
        )
    
class EvidenceCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.EvidenceCreateSerializer

    def post(self, request, complaint_id):
        serializer = self.serializer_class(
            data=request.data,
            context={
                "request": request,
                "complaint_id": complaint_id
            }
        )
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save()

        return Response(
            {"id": evidence.id, "message": "Complaint created"},
            status=status.HTTP_201_CREATED
        )
# views.py
class CitizenComplaintGroupStatus(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ResolveGroupStatusSerializer

    def post(self, request, group_id):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            group = complaints_entity.ComplaintGroup.objects.get(id=group_id)
        except complaints_entity.ComplaintGroup.DoesNotExist:
            return Response(
                {"detail": "Complaint group not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Better way: Check if citizen_profile exists
        if not hasattr(request.user, 'citizen_profile'):
            return Response(
                {"detail": "Citizen profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        citizen_profile = request.user.citizen_profile

        new_status = serializer.validated_data.get("status")
        
        # RESOLVED - Only complaint owners in this group can mark as resolved
        if new_status == 'RESOLVED':
            filed_complaint = group.complaints.filter(citizen=citizen_profile).exists()
            if not filed_complaint:
                return Response(
                    {"message": "Only complaint owners in this group can mark as RESOLVED"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            group.grouped_status = 'RESOLVED'
            group.save(update_fields=["grouped_status"])
            
            return Response(
                {
                    "id": group.id,
                    "status": group.grouped_status,
                    "message": "Complaint group marked as RESOLVED"
                },
                status=status.HTTP_200_OK
            )
        
        # CLOSED - Any authenticated citizen can vote (not just group members)
        elif new_status == 'CLOSED':
            # Prevent complaint owners in this group from voting to close
            # is_complaint_owner = group.complaints.filter(citizen=citizen_profile).exists()
            # if is_complaint_owner:
            #     return Response(
            #         {"message": "Complaint owners cannot close their own complaints"},
            #         status=status.HTTP_403_FORBIDDEN
            #     )
            
            # Get or create ComplaintCount for this group
            complaint_count, created = complaints_entity.ComplaintCount.objects.get_or_create(
                complaint=group.complaints.first()
            )
            
            # Increment close count
            complaint_count.closed_count += 1
            complaint_count.save(update_fields=['closed_count'])
            
            verification_remaining = max(0, 2 - complaint_count.closed_count)
            
            # Check if threshold reached
            if complaint_count.closed_count >= 2:
                group.grouped_status = 'CLOSED'
                group.save(update_fields=["grouped_status"])
                message = "Complaint group CLOSED"
            else:
                message = f"Close vote recorded. {verification_remaining} more needed"
            
            return Response(
                {
                    "id": group.id,
                    "status": group.grouped_status,
                    "message": message,
                    "verification_remaining": verification_remaining
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {"message": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST
        )
class MyComplaintsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintListSerializer

    def get(self, request):
        try:
            citizen_profile = request.user.citizen_profile
        except AttributeError:
            return Response(
                {"detail": "Citizen profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        my_complaints = Complaint.objects.filter(citizen=citizen_profile)
        serializer = self.serializer_class(my_complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
