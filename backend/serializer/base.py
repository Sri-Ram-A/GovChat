# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate

User = get_user_model()

class UserAllSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class UserRegisterSerializer(serializers.ModelSerializer):
    '''
    1.1 Password and Password2 fields are checked and validates password strength using Django's built-in validators (django.contrib.auth.password_validation.validate_password)
    1.2 `password` is write-only and never returned in API responses
    2. Custom Validate() function is called to compare password and password1
    '''
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        help_text="User password (must satisfy Django password validators)"
    )

    password2 = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Password confirmation (must match password)"
    )

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'phone_number') # These fields are already present in AbstractUser class of Django 

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"error": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        '''Creates and returns a new User instance.'''
        validated_data.pop('password2') # validated_data["password"] is enough
        password = validated_data.pop('password') # validated_data["password"] is enough
        user = User.objects.create_user(password=password,**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"],password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        return user
