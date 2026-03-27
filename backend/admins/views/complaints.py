    
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404

import entities.complaints as complaints_entity
import serializer.complaints as complaints_serializer

from loguru import logger
import requests

class DepartmentListComplaints(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintListSerializer
    def get(self, request):
        # When you access a ForeignKey field without _id, Django gives you:
        # the related model object
        department = request.user.admin_profile.department
        if not department:
            return Response(
                {"detail": "Admin not assigned to a department"},
                status=status.HTTP_400_BAD_REQUEST
            )
        # When I fetch these objects, also fetch their related objects in the same SQL query using JOINs.
        complaints = (
            complaints_entity.Complaint.objects
            .filter(department=department)
            .select_related("citizen", "department")
            .prefetch_related("evidences")
        )
        serializer = self.serializer_class(complaints, many=True)
        return Response(serializer.data)

class DepartmentListComplaintGroups(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintGroupSerializer

    def get(self, request):
        department = request.user.admin_profile.department
        if not department:
            return Response(
                {"detail": "Admin not assigned to a department"},
                status=status.HTTP_400_BAD_REQUEST
            )
        qs = (
            complaints_entity.ComplaintGroup.objects
            .filter(department=department)
            .annotate(complaints_count=Count("complaints"))
        )
        serializer = self.serializer_class(qs, many=True)
        return Response(serializer.data)

class ParticularComplaintGroup(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintListSerializer

    def get(self, request, group_id):
        department = request.user.admin_profile.department
        group = get_object_or_404(
            complaints_entity.ComplaintGroup,
            id=group_id,
            department=department
        )
        qs = (
            complaints_entity.Complaint.objects
            .filter(group=group)
            .select_related("citizen", "department")
            .prefetch_related("evidences")
        )
        serializer = self.serializer_class(qs, many=True)
        return Response(serializer.data)

class GroupTimelineCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.GroupTimelineCreateSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data,context={"request": request})
        serializer.is_valid(raise_exception=True)
        timeline = serializer.save()
        return Response(
            {"id": timeline.id, "message": "Timeline created"},
            status=status.HTTP_201_CREATED
        )

class ComplaintDetailedView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintDetailedViewSerializer

    def get(self, request, complaint_id):
        complaint = (
            complaints_entity.Complaint.objects
            .select_related("citizen", "department", "group")
            .prefetch_related(
                "evidences",
                # "comments",
                "group__timeline" # Django traverses relations automatically
            )
        )
        complaint = get_object_or_404(complaint, id=complaint_id)
        serializer = self.serializer_class(complaint)
        return Response(serializer.data)

class  ResolveComplaintGroupStatus(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ResolveGroupStatusSerializer

    def post(self, request, group_id):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            group = complaints_entity.ComplaintGroup.objects.get(id=group_id)
        except complaints_entity.ComplaintGroup.DoesNotExist:
            return Response(
                {"detail": "Complaint group not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = serializer.validated_data.get("status", "OPEN")
        
        # Check if admin is trying to set RESOLVED or CLOSED status
        if new_status in [ 'CLOSED']:
            return Response(
                {"message": "Complaints cannot be closed by admin"},
                status=status.HTTP_403_FORBIDDEN
            )
        if new_status in [ 'RESOLVED']:
            return Response(
                {"message": "Complaints cannot be Resolved by admin"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        group.grouped_status = new_status
        print("this is the status", group.grouped_status)
        group.save(update_fields=["grouped_status"])

        return Response(
            {
                "id": group.id,
                "status": group.grouped_status,
                "message": "Group status updated successfully"
            },
            status=status.HTTP_200_OK
        )

class GeoTestAPIView(APIView):
    def post(self, request):
        lat = request.data.get("latitude")
        lng = request.data.get("longitude")

        logger.debug("Received GEO test | lat=%s | lng=%s", lat, lng)

        if lat is None or lng is None:
            return Response(
                {"error": "latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # LocationIQ config
        LOCATIONIQ_KEY = "pk.371a6630b5644f04659e2e3a616ca5c2"
        url = "https://us1.locationiq.com/v1/reverse"

        params = {
            "key": LOCATIONIQ_KEY,
            "lat": lat,
            "lon": lng,
            "format": "json"
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()

        except requests.RequestException as e:
            logger.error("LocationIQ error: %s", str(e))
            return Response(
                {"error": "Failed to resolve location"},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # Generate jurisdiction data - PASS THE FULL DATA OBJECT
        address = data.get("address", {})
        jurisdiction = self.generate_location_data(data)  # Changed from address to data

        # Remove unwanted fields
        filtered_response = {
            "lat": data.get("lat"),
            "lon": data.get("lon"),
            "display_name": data.get("display_name"),
            "address": address,
            "jurisdiction": jurisdiction,
        }

        logger.debug("Resolved address: %s", filtered_response)

        return Response(
            filtered_response,
            status=status.HTTP_200_OK
        )

    def generate_location_data(self, data_json):
        # Extract address from the data
        address = data_json.get("address", {})
        
        state = address.get("state", "")
        city = address.get("city", "")
        
        # NAME
        name = address.get("suburb") or address.get("neighbourhood") or address.get("village")
        
        # CODE
        state_code = state[:2].upper() if state else "XX"
        city_code = city[:5].upper() if city else "XXXXX"
        name_code = name[:3].upper() if name else "XXX"
        code = f"{state_code}-{city_code}-{name_code}"
        
        # LOCATION - now accessible from root data_json
        location = data_json.get("display_name") 
        
        return {
            "NAME": name,
            "CODE": code,
            "LOCATION": location
        }