from entities.governance import Department,Jurisdiction,Domain
from rest_framework import serializers

class JurisdictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jurisdiction
        fields="__all__"

    def validate(self, attrs):
        name = attrs["name"].strip().lower()
        code = attrs["code"].strip().lower()
        if Jurisdiction.objects.filter(
            name__iexact=name,
            code__iexact=code
        ).exists():
            raise serializers.ValidationError("Jurisdiction with similar name and code already exists.")
        attrs["name"] = name
        attrs["code"] = code
        return attrs

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = "__all__"

    def validate(self, attrs):
        name = attrs["name"].strip().lower()
        if Domain.objects.filter(name__iexact=name).exists():
            raise serializers.ValidationError("A similar domain already exists.")
        attrs["name"] = name
        return attrs

class DepartmentSerializer(serializers.ModelSerializer):
    domains = serializers.PrimaryKeyRelatedField(many=True,queryset=Domain.objects.all())
    jurisdiction = serializers.PrimaryKeyRelatedField(queryset=Jurisdiction.objects.all())

    class Meta:
        model = Department
        fields = "__all__"

    def validate(self, attrs):
        attrs["name"] = attrs["name"].strip()
        attrs["code"] = attrs["code"].strip().lower()
        return attrs

    def create(self, validated_data):
        domains = validated_data.pop("domains")
        department = Department.objects.create(**validated_data)
        department.domains.set(domains)
        return department
