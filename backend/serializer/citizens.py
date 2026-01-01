from rest_framework import serializers
from entities.citizens import CitizenProfile
from .base import UserAllSerializer , UserRegisterSerializer

class CitizenProfileSerializer(serializers.ModelSerializer):
    user = UserAllSerializer(read_only=True)

    class Meta:
        model = CitizenProfile
        fields = "__all__"

class CitizenRegistrationSerializer(serializers.ModelSerializer):
    '''This serializer expects a field called user, and that field is a nested object that must follow UserRegisterSerializer.'''
    
    user = UserRegisterSerializer()

    class Meta:
        model = CitizenProfile
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_serializer = UserRegisterSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()
        citizen_profile = CitizenProfile.objects.create(user=user,**validated_data)
        return citizen_profile



