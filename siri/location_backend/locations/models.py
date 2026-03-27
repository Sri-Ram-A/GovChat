# app/models.py
from django.db import models

class ServiceLocation(models.Model):
    service_name = models.TextField()
    location_description = models.TextField()

    latitude = models.FloatField()
    longitude = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(latitude__gte=-90, latitude__lte=90),
                name="latitude_valid"
            ),
            models.CheckConstraint(
                check=models.Q(longitude__gte=-180, longitude__lte=180),
                name="longitude_valid"
            ),
            models.UniqueConstraint(
                fields=["latitude", "longitude"],
                name="unique_location_coordinates"
            ),
        ]

    def __str__(self):
        return f"{self.service_name} ({self.latitude}, {self.longitude})"
