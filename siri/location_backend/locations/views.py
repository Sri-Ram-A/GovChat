from django.http import JsonResponse
from django.db import connection


def get_service_locations(request):
    query = """
        SELECT
            service_name,
            location_description,
            latitude,
            longitude
        FROM service_locations
        ORDER BY id ASC;
    """

    with connection.cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()

    data = [
        {
            "name": row[0],
            "location": row[1],
            "lat": row[2],
            "lng": row[3],
        }
        for row in rows
    ]

    return JsonResponse(data, safe=False)
