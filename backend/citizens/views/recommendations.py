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
            
            # Using exact column names from your database
            sql = """
                SELECT 
                    slug, name, short_title, level, ministry,
                    brief_description, eligibility, benefits, 
                    application_process, application_url, categories, tags
                FROM schemes
                WHERE slug = %s
            """
            
            with psycopg.connect(SUPABASE_URL, sslmode=SSL_MODE) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, [slug])
                    row = cur.fetchone()
                    
            if not row:
                return Response({"status": "error", "message": "Scheme not found"}, status=404)
                
            # Row indices (0-11) matching the SELECT order above
            scheme = {
                "slug": row[0],
                "name": row[1],
                "short_title": row[2] or "",
                "level": row[3] or "",
                "ministry": row[4] or "",
                "brief_description": row[5] or "",
                "description": row[6] or "",
                "eligibility": row[6] or "",
                "benefits": row[7] or "",
                "application_process": row[8] or "",
                "application_url": row[9] or "",
                "categories": row[10] if row[10] else [],
                "tags": row[11] if row[11] else [],
            }
            
            return Response({"status": "success", "scheme": scheme})
            
        except Exception as e:
            logger.error("Scheme detail failed: {}", e)
            return Response({"status": "error", "message": str(e)}, status=500)