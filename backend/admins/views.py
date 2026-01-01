from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from entities.admins import AdminProfile
import  serializer.admins as admin_serializer
import serializer.base as base_serializer
from loguru import logger

class AdminListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        admins = (AdminProfile.objects.select_related('user', 'department').all())
        serializer = admin_serializer.AdminProfileSerializer(admins, many=True)
        return Response(serializer.data)

class CitizenRegistrationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = admin_serializer.AdminRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            admin = serializer.save()
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

