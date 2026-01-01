from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from entities.admins import AdminProfile
from serializer.admins import AdminProfileSerializer

class AdminListAPIView(APIView):
    def get(self, request):
        admins = (AdminProfile.objects.select_related('user', 'department').all())
        serializer = AdminProfileSerializer(admins, many=True)
        return Response(serializer.data)