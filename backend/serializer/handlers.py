from rest_framework import serializers

from entities.handlers import HandlerProfile
from entities.governance import Department
from .base import UserAllSerializer , UserRegisterSerializer

class HandlerProfileSerializer(serializers.ModelSerializer):
    user = UserAllSerializer(read_only=True)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True,
        allow_null=False
    )
    class Meta:
        model = HandlerProfile
        fields = '__all__'

class HandlerRegistrationSerializer(serializers.ModelSerializer):
    '''This serializer expects a field called user, and that field is a nested object that must follow UserRegisterSerializer.'''
    
    user = UserRegisterSerializer()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True,
        allow_null=False
    )
    class Meta:
        model = HandlerProfile
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_serializer = UserRegisterSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()
        citizen_profile = HandlerProfile.objects.create(user=user,**validated_data)
        return citizen_profile
class HandlerDepartmentsSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name")
    email = serializers.EmailField(source="user.email")
    group_id = serializers.IntegerField(source="group.id", allow_null=True)
    group_title = serializers.CharField(source="group.title", allow_null=True)

    class Meta:
        model = HandlerProfile
        fields = [
            "id",
            "name",
            "email",
            "group_id",
            "group_title",
        ]