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
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        citizens = CitizenProfile.objects.select_related('user').all()
        serializer = citizens_serializer.CitizenProfileSerializer(citizens, many=True)
        return Response(serializer.data)
    
class CitizenRegistrationAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = citizens_serializer.CitizenRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            citizen = serializer.save()
            return Response({
                "message": "Registration successful",
            }, status=status.HTTP_201_CREATED)
        logger.debug(serializer.errors)
        return Response({"message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class CitizenLoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = base_serializer.UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({"access": str(refresh.access_token),"refresh": str(refresh),}, status=status.HTTP_200_OK)

class CitizenComplaintView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get complaints of the logged-in citizen"""
        citizen_profile = request.user.citizen_profile
        # The above acess is correct because of :  user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="citizen_profile")
        complaints = Complaint.objects.filter(citizen=citizen_profile)
        serializer = complaints_serializer.ComplaintListSerializer(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new complaint"""
        serializer = complaints_serializer.ComplaintCreateSerializer(data=request.data,context={"request": request})
        if serializer.is_valid():
            complaint = serializer.save()
            return Response({"message": "Complaint submitted successfully", "id": complaint.id},status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EvidenceUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = complaints_serializer.EvidenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

class AllComplaintsView(APIView):
    # permission_classes = [IsAdminUser]
    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = complaints_serializer.ComplaintListSerializer(complaints, many=True)
        if serializer.data[0] : logger.debug(serializer.data[0])
        return Response(serializer.data, status=status.HTTP_200_OK)
