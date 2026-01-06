from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from entities.admins import AdminProfile
from entities.governance import Department
import  serializer.admins as admin_serializer
import serializer.governance as governance_serializer
import serializer.base as base_serializer
from loguru import logger

class AdminListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        admins = (AdminProfile.objects.select_related('user', 'department').all())
        serializer = admin_serializer.AdminProfileSerializer(admins, many=True)
        return Response(serializer.data)

class DepartmentsListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        departments = Department.objects.all()
        logger.debug(departments)
        serializer = governance_serializer.DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

