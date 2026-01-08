from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from entities.citizens import CitizenProfile
from entities.complaints import Complaint

import serializer.citizens as citizens_serializer
import serializer.complaints as complaints_serializer
import serializer.base as base_serializer
from loguru import logger
from rest_framework.generics import CreateAPIView

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
        """Create a new complaint"""
        serializer_class = self.get_serializer_class()
        if serializer_class : serializer = serializer_class(data=request.data, context={"request": request})
        if serializer.is_valid():
            complaint = serializer.save()
            return Response({
                "message": "Complaint submitted successfully",
                "id": complaint.id # type: ignore
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EvidenceUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.EvidenceSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

class AllComplaintsView(APIView):
    # permission_classes = [IsAdminUser]
    serializer_class = complaints_serializer.ComplaintListSerializer
    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = self.serializer_class(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
