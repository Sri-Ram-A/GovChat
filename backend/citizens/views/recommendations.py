from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from loguru import logger
import psycopg
import os

from entities.citizens import CitizenProfile
from citizens.recommendation import recommend_schemes


class RecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = CitizenProfile.objects.get(user=request.user)
            schemes = recommend_schemes(profile, limit=5)
            return Response({
                "status": "success",
                "count": len(schemes),
                "recommendations": schemes
            })
        except CitizenProfile.DoesNotExist:
            return Response({
                "status": "success",
                "count": 0,
                "recommendations": []
            })
        except Exception as e:
            logger.error("Recommendations endpoint failed: {}", e)
            return Response({
                "status": "error",
                "message": str(e)
            }, status=500)
        
class SchemeDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, slug):
        try:
            SUPABASE_URL = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
            SSL_MODE = os.getenv("DATABASE_SSLMODE", "require")
            
            sql = """
                SELECT slug, name, ministry, level, brief_description,
                       eligibility, benefits, categories, tags, application_url
                FROM schemes
                WHERE slug = %s
            """
            
            with psycopg.connect(SUPABASE_URL, sslmode=SSL_MODE) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, [slug])
                    row = cur.fetchone()
                    
            if not row:
                return Response({"status": "error", "message": "Scheme not found"}, status=404)
                
            scheme = {
                "slug": row[0],
                "name": row[1],
                "ministry": row[2],
                "level": row[3],
                "brief_description": row[4],
                "eligibility": row[5],
                "benefits": row[6],
                "categories": row[7] or [],
                "tags": row[8] or [],
                "application_url": row[9],
            }
            
            return Response({"status": "success", "scheme": scheme})
            
        except Exception as e:
            logger.error("Scheme detail failed: {}", e)
            return Response({"status": "error", "message": str(e)}, status=500)