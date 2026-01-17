from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from entities.admins import AdminProfile
from entities.governance import Department,Jurisdiction,Domain

import  serializer.admins as admin_serializer
import serializer.governance as governance_serializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class JurisdictionAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = governance_serializer.JurisdictionSerializer

    def get(self, request):
        qs = Jurisdiction.objects.all()
        return Response(self.serializer_class(qs, many=True).data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        jurisdiction = serializer.save()
        return Response(self.serializer_class(jurisdiction).data,status=status.HTTP_201_CREATED)


class DomainAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = governance_serializer.DomainSerializer

    def get(self, request):
        qs = Domain.objects.all()
        return Response(self.serializer_class(qs, many=True).data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        domain = serializer.save()
        return Response(self.serializer_class(domain).data,status=status.HTTP_201_CREATED)


class DepartmentAPIView(APIView):
    permission_classes = [AllowAny]
    serializer_class = governance_serializer.DepartmentSerializer

    def get(self, request):
        departments = Department.objects.all()
        serializer = self.serializer_class(departments, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        return Response(self.serializer_class(department).data,status=status.HTTP_201_CREATED)
