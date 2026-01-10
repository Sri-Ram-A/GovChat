from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from entities.admins import AdminProfile
from entities.governance import Department
import  serializer.admins as admin_serializer
import serializer.governance as governance_serializer

class AdminListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    serializer_class = admin_serializer.AdminProfileSerializer
    def get(self, request):
        admins = (AdminProfile.objects.select_related('user', 'department').all())
        serializer = self.serializer_class(admins, many=True)
        return Response(serializer.data)

class DepartmentsListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    serializer_class = governance_serializer.DepartmentSerializer
    def get(self, request):
        departments = Department.objects.all()
        serializer = self.serializer_class(departments, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
