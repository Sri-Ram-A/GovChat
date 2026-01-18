from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser

import serializer.complaints as complaints_serializer
from entities.complaints import Complaint
from citizens import helper

class AllComplaintsView(APIView):
    serializer_class = complaints_serializer.ComplaintListSerializer

    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = self.serializer_class(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ImageCaptionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.ImageCaptionSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data.get("file",None)
        caption, dept_name, confidence = helper.analyze_image(file)
        department = helper.get_or_create_department(dept_name)
        return Response({
            "caption": caption,
            "suggested_department": {
                "id": department.id,
                "name": department.name
            },
            "confidence": confidence
        })

class ResolveLocationAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ResolveLocationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        lat = serializer.validated_data.get("latitude")
        lon = serializer.validated_data.get("longitude")

        location = helper.resolve_location(lat, lon)
        return Response(location)


class ComplaintCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = complaints_serializer.ComplaintCreateSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data,context={"request": request})
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()
        return Response(
            {"id": complaint.id, "message": "Complaint created"},
            status=status.HTTP_201_CREATED
        )
    
class EvidenceCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = complaints_serializer.EvidenceCreateSerializer

    def post(self, request, complaint_id):
        serializer = self.serializer_class(
            data=request.data,
            context={
                "request": request,
                "complaint_id": complaint_id
            }
        )
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save()

        return Response(
            {"id": evidence.id, "message": "Complaint created"},
            status=status.HTTP_201_CREATED
        )

