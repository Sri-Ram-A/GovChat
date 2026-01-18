from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
import entities.complaints as complaints_entity
import entities.governance as complaints_governance


class ImageCaptionSerializer(serializers.Serializer):
    file = serializers.ImageField()

class ResolveLocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

class ComplaintCreateSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(queryset=complaints_entity.Department.objects.all())
    class Meta:
        model = complaints_entity.Complaint
        exclude = ["citizen", "timestamp", "likes_count", "status","group"]

    def create(self, validated_data):
        request = self.context["request"]

        return complaints_entity.Complaint.objects.create(
            citizen=request.user.citizen_profile,
            status="OPEN",
            **validated_data
        )

class EvidenceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Evidence
        fields = ['file', 'media_type', 'caption', 'suggested_department']
        read_only_fields = ['caption', 'suggested_department']

    def validate(self, attrs):
        request = self.context["request"]
        complaint_id = self.context.get("complaint_id")
        if not complaint_id:
            raise ValidationError("Complaint ID missing")
        # Fetch complaint
        complaint = get_object_or_404(complaints_entity.Complaint,id=complaint_id)
        # Ownership validation
        if complaint.citizen != request.user.citizen_profile:
            raise PermissionDenied("You do not own this complaint")
        # Status validation
        if complaint.status in ["CLOSED", "RESOLVED"]:
            raise ValidationError("Cannot upload evidence to a closed or resolved complaint")
        # Media-type sanity
        allowed = dict(complaints_entity.Evidence.MEDIA_TYPE_CHOICES)
        if attrs["media_type"] not in allowed:
            raise ValidationError({"media_type": "Invalid media type"})
        # File sanity
        file = attrs.get("file")
        if not file:
            raise ValidationError({"file": "File is required"})
        if file.size > 20 * 1024 * 1024:
            raise ValidationError({"file": "File exceeds 20MB limit"})
        # Attach complaint for create()
        attrs["complaint"] = complaint
        return attrs

    def create(self, validated_data):
        return complaints_entity.Evidence.objects.create(**validated_data)

class EvidenceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Evidence
        fields = ['file', 'media_type', 'caption', 'suggested_department']
        read_only_fields = ['caption', 'suggested_department']

class ComplaintListSerializer(serializers.ModelSerializer):
    citizen = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    evidences = EvidenceListSerializer(many=True)
    class Meta:
        model = complaints_entity.Complaint
        fields = "__all__"
class ComplaintGroupSerializer(serializers.ModelSerializer):
    department = serializers.StringRelatedField()
    complaints_count = serializers.IntegerField()
    class Meta:
        model = complaints_entity.ComplaintGroup
        fields = "__all__"
