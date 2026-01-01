from rest_framework import serializers
from django.contrib.auth import get_user_model

from entities.admins import AdminProfile
from .base import UserAllSerializer
from .governance import DepartmentSerializer

class AdminProfileSerializer(serializers.ModelSerializer):
    user = UserAllSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = AdminProfile
        fields = '__all__'
