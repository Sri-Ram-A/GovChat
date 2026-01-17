from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated,IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken

from entities.citizens import CitizenProfile
from entities.complaints import Complaint

import serializer.citizens as citizens_serializer
import serializer.complaints as complaints_serializer
import serializer.base as base_serializer


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
