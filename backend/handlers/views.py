from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from entities.handlers import HandlerProfile 
import serializer.base as base_serializer
import  serializer.handlers as handler_serializer


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