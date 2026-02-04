from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
import entities.complaints as complaints_entity
import entities.governance as complaints_governance
from entities.admins import AdminProfile
from entities.complaints import ComplaintCount


# ==================== UTILITY SERIALIZERS ====================

class ImageCaptionSerializer(serializers.Serializer):
    file = serializers.ImageField()


class ResolveLocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class ResolveGroupStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            ('OPEN', 'Open'),
            ('IN_PROGRESS', 'In Progress'),
            ('RESOLVED', 'Resolved'),
            ('CLOSED', 'Closed'),
        ]
    )


# ==================== COMPLAINT COUNT ====================

class ComplaintCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintCount
        fields = ['complaint', 'closed_count']
        read_only_fields = ['complaint']


# ==================== EVIDENCE SERIALIZERS ====================

class EvidenceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = complaints_entity.Evidence
        fields = ['id', 'file', 'media_type', 'caption', 'suggested_department']
        read_only_fields = ['caption', 'suggested_department']


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
        complaint = get_object_or_404(complaints_entity.Complaint, id=complaint_id)
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


# ==================== TIMELINE SERIALIZERS ====================

class GroupTimelineSerializer(serializers.ModelSerializer):
    """Serializer for timeline entries - shows who posted (admin or handler)"""
    posted_by = serializers.SerializerMethodField()
    posted_by_name = serializers.SerializerMethodField()
    

    class Meta:
        model = complaints_entity.GroupTimeline
        fields = ["id", "title", "text", "image", "created_at", "posted_by", "posted_by_name"]

    def get_posted_by(self, obj):
        """Returns role: Admin or Handler"""
        if obj.admin:
            return "Admin"
        elif obj.handler:
            return "Handler"
        return "Unknown"

    def get_posted_by_name(self, obj):
        """Returns the actual name of who posted"""
        if obj.admin:
            return str(obj.admin.user.get_full_name() or obj.admin.user.username)
        elif obj.handler:
            return str(obj.handler.user.get_full_name() or obj.handler.user.username)
        return "Unknown"


class GroupTimelineCreateSerializer(serializers.ModelSerializer):
    """Used by admins to create timeline entries"""
    group = serializers.PrimaryKeyRelatedField(queryset=complaints_entity.ComplaintGroup.objects.all())

    class Meta:
        model = complaints_entity.GroupTimeline
        exclude = ["admin", "handler"]

    def create(self, validated_data):
        request = self.context["request"]
        return complaints_entity.GroupTimeline.objects.create(
            admin=request.user.admin_profile,
            **validated_data
        )


# ==================== COMPLAINT SERIALIZERS ====================

class ComplaintCreateSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(queryset=complaints_entity.Department.objects.all())

    class Meta:
        model = complaints_entity.Complaint
        exclude = ["citizen", "timestamp", "likes_count", "status", "group"]

    def create(self, validated_data):
        request = self.context["request"]
        return complaints_entity.Complaint.objects.create(
            citizen=request.user.citizen_profile,
            status="OPEN",
            **validated_data
        )


class ComplaintInGroupSerializer(serializers.ModelSerializer):
    """Serializer for complaints within a group - used in group detail views"""
    citizen = serializers.StringRelatedField()
    department = serializers.StringRelatedField()

    class Meta:
        model = complaints_entity.Complaint
        fields = [
            'id',
            'title',
            'description',
            'status',
            'citizen',
            'department',
            'address_line_1',
            'address_line_2',
            'landmark',
            'city',
            'pincode',
            'latitude',
            'longitude',
            'timestamp',
            'likes_count'
        ]


class ComplaintListSerializer(serializers.ModelSerializer):
    """Basic list view of complaints"""
    citizen = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    evidences = EvidenceListSerializer(many=True)

    class Meta:
        model = complaints_entity.Complaint
        fields = "__all__"


class ComplaintDetailedViewSerializer(serializers.ModelSerializer):
    """Detailed view of a single complaint with all related data"""
    citizen = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    evidences = EvidenceListSerializer(many=True, read_only=True)
    # comments = CommentSerializer(many=True, read_only=True)  # Uncomment when ready
    group = serializers.SerializerMethodField()

    class Meta:
        model = complaints_entity.Complaint
        fields = "__all__"

    def get_group(self, obj):
        """Only include group if it exists"""
        if obj.group:
            return {
                "id": obj.group.id,
                "title": obj.group.title,
                "grouped_status": obj.group.grouped_status
            }
        return None


# ==================== COMPLAINT GROUP SERIALIZERS ====================

class ComplaintGroupSerializer(serializers.ModelSerializer):
    """List view of complaint groups - used by admins to see all groups"""
    department = serializers.StringRelatedField()
    complaints_count = serializers.IntegerField()
    timeline = GroupTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = complaints_entity.ComplaintGroup
        fields = "__all__"


class ParticularComplaintGroupSerializer(serializers.ModelSerializer):
    """
    Detailed view of a single complaint group.
    Used by:
    - Admins when viewing a specific group
    - Handlers when viewing their assigned group
    
    Includes all complaints in the group and full timeline.
    """
    department = serializers.StringRelatedField()
    complaints = ComplaintInGroupSerializer(many=True, read_only=True)
    complaints_count = serializers.SerializerMethodField()
    timeline = GroupTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = complaints_entity.ComplaintGroup
        fields = [
            'id',
            'title',
            'department',
            'centroid_latitude',
            'centroid_longitude',
            'radius_meters',
            'grouped_status',
            'created_at',
            'updated_at',
            'complaints',
            'complaints_count',
            'timeline'
        ]

    def get_complaints_count(self, obj):
        return obj.complaints.count()