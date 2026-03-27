LOCATION SERVICE API – INTEGRATION GUIDE
======================================

This document explains how to integrate the `locations` map API module
into an existing Django backend.

This module exposes a read-only API that returns curated service locations
with coordinates, intended for map rendering, navigation, or recommendations.

--------------------------------------
1. COPY MODULE INTO PROJECT
--------------------------------------

Copy the folder `locations/` into the Django project root
(the same level where `manage.py` exists).

Final structure should look like:

project_root/
├── manage.py
├── project_backend/
│   ├── settings.py
│   ├── urls.py
│   └── ...
└── locations/
    ├── __init__.py
    ├── apps.py
    ├── urls.py
    ├── views.py
    └── db/
        ├── schema.sql
        └── data.sql


--------------------------------------
2. REGISTER DJANGO APP
--------------------------------------

Open `settings.py` and add the app:

INSTALLED_APPS += [
    'locations.apps.LocationsConfig',
]

No migrations are required (raw SQL is used).


--------------------------------------
3. DATABASE CONFIGURATION (PostgreSQL)
--------------------------------------

Ensure PostgreSQL is configured in `settings.py`:

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'location',
        'USER': '<postgres_user>',
        'PASSWORD': '<postgres_password>',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

Database name MUST be `location` unless changed consistently.


--------------------------------------
4. CREATE TABLE + LOAD DATA (ONE TIME)
--------------------------------------

Using pgAdmin or psql, run these SQL files in this order:

1) db/schema.sql
   → creates table `service_locations`

2) db/data.sql
   → inserts all curated service locations

This step is done ONLY ONCE.


--------------------------------------
5. EXPOSE API ENDPOINT
--------------------------------------

Open the PROJECT-LEVEL `urls.py`
(NOT the app urls.py):

Add:

from django.urls import path, include

urlpatterns += [
    path('api/', include('locations.urls')),
]

This exposes the endpoint:

GET /api/locations/


--------------------------------------
6. CORS HANDLING
--------------------------------------

CORS is already handled explicitly in the API response.
No middleware or extra packages are required.

The API returns:
Access-Control-Allow-Origin: *


--------------------------------------
7. RUN SERVER
--------------------------------------

Start the backend:

python manage.py runserver

Verify API:

http://127.0.0.1:8000/api/locations/

Expected response:
JSON array of objects with:
- name
- location
- lat
- lng


--------------------------------------
8. FRONTEND USAGE
--------------------------------------

Frontend (any framework) should call:

GET http://<server-ip>:8000/api/locations/

Example response object:

{
  "name": "BBMP Ward Office",
  "location": "Kengeri Satellite Town",
  "lat": 12.91,
  "lng": 77.48
}

Compatible with:
- OpenStreetMap / Leaflet
- Google Maps
- Mapbox
- Routing / GIS systems


--------------------------------------
9. DESIGN NOTES
--------------------------------------

- No ORM used (raw SQL for performance and portability)
- Unique coordinates enforced at DB level
- Read-only API (safe)
- Scales to 70k+ locations
- Can be reused across projects

--------------------------------------
END OF DOCUMENT
--------------------------------------