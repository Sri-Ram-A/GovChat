from rest_framework import serializers
import entities.complaints as complaints_entity


# serializers.py
class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Complaint
        fields = [
            "title", "description", "department", 
            "address_line_1", "address_line_2",
            "landmark", "city", "pincode",
            "latitude", "longitude"
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
    
class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Evidence
        fields = ['id', 'complaint', 'file', 'media_type']

class ComplaintListSerializer(serializers.ModelSerializer):
    evidences = EvidenceSerializer(many=True)

    class Meta:
        model = complaints_entity.Complaint
        fields = "__all__"