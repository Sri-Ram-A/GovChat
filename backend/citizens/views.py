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
        # ---------------- Validate Request Data ----------------
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file_obj = request.FILES.get("file")
        media_type = serializer.validated_data.get("media_type")
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        
        # ---------------- Validate Geolocation ----------------
        if not latitude or not longitude:
            return Response(
                {"error": "latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ---------------- Create Draft Complaint ----------------
        citizen_profile = request.user.citizen_profile
        default_department = Department.objects.get(id=1)
        draft_complaint = Complaint.objects.create(
            citizen=citizen_profile,
            department=default_department,  # Will be set after AI analysis
            title=f"Draft - {timezone.now().strftime('%Y%m%d%H%M%S')}",
            description="",
            status="DRAFT",
            latitude=latitude,
            longitude=longitude
        )
        
        logger.debug("Created draft complaint | id=%s", draft_complaint.id)
        
        # ---------------- Resolve Location via LocationIQ ----------------
        LOCATIONIQ_KEY = "pk.371a6630b5644f04659e2e3a616ca5c2"
        url = "https://us1.locationiq.com/v1/reverse"
        
        params = {
            "key": LOCATIONIQ_KEY,
            "lat": latitude,
            "lon": longitude,
            "format": "json"
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            location_data = response.json()
            
            address = location_data.get("address", {})
            
            # Extract location details
            city = address.get("city") or address.get("town") or address.get("village") or ""
            pincode = address.get("postcode") or ""
            state = address.get("state") or ""
            address_line_1 = location_data.get("display_name") or ""
            
            logger.debug("Resolved location | city=%s | pincode=%s", city, pincode)
            
        except requests.RequestException as e:
            logger.error("LocationIQ error: %s", str(e))
            # Continue without location data
            city = ""
            pincode = ""
            state = ""
            address_line_1 = ""
            location_data = {}
            address = {}
        
        # ---------------- Generate Jurisdiction Data ----------------
        suburb = address.get("suburb") or address.get("neighbourhood") or address.get("village") or "Unknown"
        
        state_code = state[:2].upper() if state else "XX"
        city_code = city[:5].upper() if city else "XXXXX"
        suburb_code = suburb[:3].upper() if suburb else "XXX"
        jurisdiction_code = f"{state_code}-{city_code}-{suburb_code}"
        
        # ---------------- Check/Create Jurisdiction ----------------
        jurisdiction = Jurisdiction.objects.filter(code=jurisdiction_code).first()
        
        if not jurisdiction:
            jurisdiction = Jurisdiction.objects.create(
                name=suburb,
                code=jurisdiction_code,
                location=address_line_1
            )
            logger.debug("Created new jurisdiction | code=%s | name=%s", jurisdiction_code, suburb)
        else:
            logger.debug("Using existing jurisdiction | code=%s", jurisdiction_code)
        
        # ---------------- AI Image Analysis ----------------
        caption = None
        pred_dept = None
        confidence = 0.0
        suggested_department = None
        
        if file_obj and media_type == "image":
            logger.debug("Running AI image analysis...")
            image_bytes = file_obj.read()
            caption, pred_dept, confidence, inference_time = itt.generate_caption_from_bytes(image_bytes)
            
            logger.debug(
                "Inference | caption='%s' | dept='%s' | confidence=%.2f | time=%.3fs",
                caption,
                pred_dept,
                confidence,
                inference_time,
            )
            
            # Reset file pointer for Django to save
            file_obj.seek(0)
        from faker import Faker
        import random

        fake = Faker("en_IN")

        def generate_department_defaults(pred_dept, jurisdiction):
            area_code = jurisdiction.code.split("-")[-1].upper()
            dept_code = pred_dept.replace(" ", "").upper()[:6]

            return {
                "name": pred_dept,
                "jurisdiction": jurisdiction,
                "code": f"{area_code}-{dept_code}",
                "contact_point": fake.name(),
                "contact_email": fake.company_email(),
                "contact_phone": fake.phone_number(),
                # 🔥 IMPORTANT: derived from jurisdiction
                "office_address": jurisdiction.location,
            }

        # ---------------- Match/Create Department ----------------
        if pred_dept:
            suggested_department = Department.objects.filter(
                name__iexact=pred_dept,
                jurisdiction=jurisdiction
            ).first()

            if not suggested_department:
                dept_data = generate_department_defaults(pred_dept, jurisdiction)

                suggested_department = Department.objects.create(**dept_data)

                logger.debug(
                    "Created new department | name=%s | code=%s | jurisdiction=%s",
                    suggested_department.name,
                    suggested_department.code,
                    jurisdiction.code
                )
            else:
                logger.debug(
                    "Using existing department | name=%s | jurisdiction=%s",
                    suggested_department.name,
                    jurisdiction.code
                )

        
        # ---------------- Update Draft Complaint with Resolved Data ----------------
        draft_complaint.city = city
        draft_complaint.pincode = pincode
        draft_complaint.address_line_1 = address_line_1
        draft_complaint.description = caption or ""
        draft_complaint.department = suggested_department
        draft_complaint.save()
        
        # ---------------- Save Evidence ----------------
        evidence = serializer.save(
            complaint=draft_complaint,
            caption=caption,
            suggested_department=suggested_department
        )
        
        logger.debug("Evidence saved | id=%s | complaint=%s", evidence.id, draft_complaint.id)
        
        # ---------------- Prepare Response ----------------
        response_data = {
            "draft_complaint_id": draft_complaint.id,
            "evidence_id": evidence.id,
            "suggestions": {
                "title": caption[:100] if caption else "Untitled Complaint",  # First 100 chars
                "description": caption or "",
                "department_id": suggested_department.id if suggested_department else None,
                "department_name": suggested_department.name if suggested_department else None,
                "confidence": round(confidence, 2),
                "city": city,
                "pincode": pincode,
                "address_line_1": address_line_1,
                "jurisdiction_code": jurisdiction_code,
                "jurisdiction_name": suburb,
                "latitude": str(latitude),
                "longitude": str(longitude)
            }
        }
        
        return Response(
            response_data,
            status=status.HTTP_201_CREATED
        )

class AllComplaintsView(APIView):
    # permission_classes = [IsAdminUser]
    serializer_class = complaints_serializer.ComplaintListSerializer
    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = self.serializer_class(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
