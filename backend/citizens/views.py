from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated,IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from entities.citizens import CitizenProfile
from entities.complaints import Complaint,Evidence

import serializer.citizens as citizens_serializer
import serializer.complaints as complaints_serializer
import serializer.base as base_serializer
from . import helper


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


# class ComplaintCreateAPIView(APIView):
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser, FormParser]
#     serializer_class = complaints_serializer.ComplaintCreateSerializer


class ComplaintCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintCreateSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()
        return Response(
            {"id": complaint.id, "message": "Complaint created"},
            status=status.HTTP_201_CREATED
        )
    
class EvidenceUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.EvidenceUploadSerializer

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

