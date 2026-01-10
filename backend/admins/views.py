from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from entities.admins import AdminProfile
from entities.governance import Department
from entities.governance import Jurisdiction

import  serializer.admins as admin_serializer
import serializer.governance as governance_serializer

from loguru import logger
import requests
class AdminListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    serializer_class = admin_serializer.AdminProfileSerializer
    def get(self, request):
        admins = (AdminProfile.objects.select_related('user', 'department').all())
        serializer = self.serializer_class(admins, many=True)
        return Response(serializer.data)

class DepartmentsListAPIView(APIView):
    # permission_classes = [IsAuthenticated]
    serializer_class = governance_serializer.DepartmentSerializer
    def get(self, request):
        departments = Department.objects.all()
        serializer = self.serializer_class(departments, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class AllJurisdictionView(APIView):
    # permission_classes = [IsAuthenticated]
    serializer_class = governance_serializer.JurisdictionSerializer
    def get(self,request):
        jurisdiction = Jurisdiction.objects.all()
        serializer = self.serializer_class(jurisdiction, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
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