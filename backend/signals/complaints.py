# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from math import radians, cos, sin, asin, sqrt
from entities.complaints import Complaint, ComplaintGroup
from loguru import logger

def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance between two lat/lng points in meters."""
    R = 6371000  # Earth radius in meters
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2]) # map(function, iterable, ...)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * asin(sqrt(a))
    return R * c

@receiver(post_save, sender=Complaint)
def assign_complaint_to_group(sender, instance, created, **kwargs):
    if (
        not created or 
        instance.status == "DRAFT" or 
        instance.latitude is None or 
        instance.longitude is None or 
        instance.group_id
    ):
        return
    # Candidate groups: same department, active
    candidate_groups = ComplaintGroup.objects.filter(
        department=instance.department,
        grouped_status__in=["OPEN", "IN_PROGRESS"]
    )

    nearest_group = None
    nearest_distance = None

    for group in candidate_groups:
        distance = haversine(instance.latitude,instance.longitude,group.centroid_latitude,group.centroid_longitude)
        if distance <= group.radius_meters:
            if nearest_distance is None or distance < nearest_distance:
                nearest_group = group
                nearest_distance = distance

    if nearest_group:
        instance.group = nearest_group
        instance.save(update_fields=["group"])
        logger.info(f"Complaint Instance alloted to group : {nearest_group}")
        return

    # No group found → create a new one
    new_group = ComplaintGroup.objects.create(
        title=instance.title[:255],
        department=instance.department,
        centroid_latitude=instance.latitude,
        centroid_longitude=instance.longitude,
        radius_meters=3000
    )

    instance.group = new_group
    instance.save(update_fields=["group"])
    logger.info(f"Complaint Instance alloted to group : {new_group}")