from rest_framework import serializers
import entities.complaints as complaints_entity

class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Complaint
        fields = [
            "department", 
            "address_line_1", "address_line_2",
            "landmark", "city", "pincode",
            "latitude","longitude",
            "title","description", 
        ]
        extra_kwargs = {
            'latitude': {'required': False},
            'longitude': {'required': False},
        }

    def create(self, validated_data):
        request = self.context["request"]
        citizen_profile = request.user.citizen_profile
        complaint = complaints_entity.Complaint.objects.create(citizen=citizen_profile, **validated_data)
        return complaint

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Complaint
        fields = [
            "title","description","department","address_line_1","address_line_2","landmark","city","pincode","latitude","longitude","status",
        ]
        extra_kwargs = {
            field: {"required": False}
            for field in fields
        }


class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Evidence
        fields = ['id', 'complaint', 'file', 'media_type','caption','suggested_department']
        # These fields will be included in the API response, but the client is NOT allowed to send or modify them in the request.
        read_only_fields = ['caption', 'suggested_department']
        extra_kwargs = {
            'complaint': {'required': False},
            'caption': {'required': False},
            'suggested_department': {'required': False}
        }

class ComplaintListSerializer(serializers.ModelSerializer):
    evidences = EvidenceSerializer(many=True)
    class Meta:
        model = complaints_entity.Complaint
        fields = "__all__"