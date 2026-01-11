from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from entities.citizens import CitizenProfile
from entities.complaints import Complaint
from entities.governance import Department
from entities.governance import Jurisdiction

import serializer.citizens as citizens_serializer
import serializer.complaints as complaints_serializer
import serializer.base as base_serializer
import serializer.governance as governance_serializer
from .itt_client import itt
from loguru import logger
import requests
from .helper import (
    validate_geolocation,
    create_draft_complaint,
    resolve_location,
    get_or_create_jurisdiction,
    analyze_image,
    get_or_create_department,
    update_draft_complaint,
    prepare_response_data
)

class CitizenListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = citizens_serializer.CitizenProfileSerializer

    def get(self, request):
        citizens = CitizenProfile.objects.select_related('user').all()
        serializer = self.serializer_class(citizens, many=True)
        return Response(serializer.data)
    
class CitizenRegistrationAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = citizens_serializer.CitizenRegistrationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            citizen = serializer.save()
            return Response({"message": "Registration successful",}, status=status.HTTP_201_CREATED)
        return Response({"message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class CitizenLoginAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = base_serializer.UserLoginSerializer # Very helpful for drf-spectacular to infer the required inputs

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user) # type: ignore
        return Response({"access": str(refresh.access_token),"refresh": str(refresh),}, status=status.HTTP_200_OK)

class CitizenComplaintView(APIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Returns different serializer depending on HTTP method"""
        if self.request.method == "GET":
            return complaints_serializer.ComplaintListSerializer
        elif self.request.method == "POST":
            return complaints_serializer.ComplaintCreateSerializer
        return None  

    def get(self, request):
        """Get complaints of the logged-in citizen"""
        citizen_profile = request.user.citizen_profile
        complaints = Complaint.objects.filter(citizen=citizen_profile)
        serializer_class = self.get_serializer_class()
        if serializer_class : serializer = serializer_class(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create or finalize complaint"""
        draft_complaint_id = request.data.get("draft_complaint_id")
        
        # ---------------- Finalize Draft Complaint ----------------
        if draft_complaint_id:
            try:
                complaint = Complaint.objects.get(
                    id=draft_complaint_id,
                    citizen=request.user.citizen_profile,
                    status="DRAFT"
                )
                
                # Update with user's final edits
                complaint.title = request.data.get("title", complaint.title)
                complaint.description = request.data.get("description", complaint.description)
                
                department_id = request.data.get("department")
                if department_id:
                    complaint.department_id = department_id
                
                complaint.city = request.data.get("city", complaint.city)
                complaint.pincode = request.data.get("pincode", complaint.pincode)
                complaint.status = "OPEN"  # Change status to OPEN
                complaint.save()
                
                logger.debug("Finalized draft complaint | id=%s", complaint.id)
                
                return Response({
                    "message": "Complaint submitted successfully",
                    "id": complaint.id
                }, status=status.HTTP_200_OK)
                
            except Complaint.DoesNotExist:
                return Response(
                    {"error": "Draft complaint not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # ---------------- Create New Complaint (Fallback) ----------------
        serializer_class = self.get_serializer_class()
        if serializer_class:
            serializer = serializer_class(data=request.data, context={"request": request})
            if serializer.is_valid():
                complaint = serializer.save()
                return Response({
                    "message": "Complaint submitted successfully",
                    "id": complaint.id
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class EvidenceUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.EvidenceSerializer
    
    def post(self, request):
        # Validate request
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file_obj = request.FILES.get("file")
        media_type = serializer.validated_data.get("media_type")
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        
        # Validate geolocation
        if error := validate_geolocation(latitude, longitude):
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        
        # Create draft complaint
        draft_complaint = create_draft_complaint(
            request.user.citizen_profile, 
            latitude, 
            longitude
        )
        
        # Resolve location
        location_info = resolve_location(latitude, longitude)
        
        # Get or create jurisdiction
        jurisdiction = get_or_create_jurisdiction(location_info)
        
        # AI analysis
        caption, pred_dept, confidence = analyze_image(file_obj, media_type)
        
        # Get or create department
        suggested_department = get_or_create_department(pred_dept, jurisdiction)
        
        # Update draft complaint
        update_draft_complaint(
            draft_complaint,
            location_info,
            caption,
            suggested_department
        )
        
        # Save evidence
        evidence = serializer.save(
            complaint=draft_complaint,
            caption=caption,
            suggested_department=suggested_department
        )
        
        logger.debug("Evidence saved | id=%s | complaint=%s", evidence.id, draft_complaint.id)
        
        # Prepare and return response
        response_data = prepare_response_data(
            draft_complaint,
            evidence,
            location_info,
            suggested_department,
            confidence
        )
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class AllComplaintsView(APIView):
    # permission_classes = [IsAdminUser]
    serializer_class = complaints_serializer.ComplaintListSerializer
    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = self.serializer_class(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
