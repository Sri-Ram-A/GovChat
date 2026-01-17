import logging
from entities.governance import Department
from .itt_client import itt
import os
from loguru import logger
import requests
LOCATIONIQ_KEY = os.getenv("LOCATIONIQ_KEY")

if LOCATIONIQ_KEY is None or not LOCATIONIQ_KEY.strip():
    logger.warning("LOCATIONIQ_KEY is not set or contains only whitespace.")
else:
    logger.success("Loaded LOCATIONIQ_KEY")

def analyze_image(file_obj):
    """Run AI analysis on image if applicable."""
    if not file_obj :
        return None, None, 0.0
    
    logger.debug("Running AI image analysis...")
    image_bytes = file_obj.read()
    caption, pred_dept, confidence, inference_time = itt.generate_caption_from_bytes(image_bytes)
    
    logger.debug(f"Inference | caption='{caption}' | dept='{pred_dept}' | confidence={confidence:.2f} | time={inference_time:.3f}s")
    # Reset file pointer for Django to save
    file_obj.seek(0)
    
    return caption, pred_dept, confidence

def get_or_create_department(pred_dept):
    """
    Return a department similar to predicted_dept.
    Fallback to default department (id=1).
    """
    # To find match
    if pred_dept:
        department = (
            Department.objects
            .filter(name__icontains=pred_dept,)
            .first()
        )
        if department:
            logger.debug(f"Matched department | name = {department.name}")
            return department

    # Fallback
    default_department = Department.objects.get(id=1)
    logger.debug(f"Falling back to default department | id=1 | name ={default_department.name}")
    return default_department

def resolve_location(latitude, longitude):
     """Resolve detailed location using LocationIQ API."""
     url = "https://us1.locationiq.com/v1/reverse"
     params = {
         "key": LOCATIONIQ_KEY,
         "lat": latitude,
         "lon": longitude,
         "format": "json"
     }
     
     try:
         response = requests.get(url, params=params, timeout=5)
         response.raise_for_status()
         location_data = response.json()
         address = location_data.get("address", {})
         
         city = address.get("city") or address.get("town") or address.get("village") or ""
         pincode = address.get("postcode") or ""
         state = address.get("state") or ""
         address_line_2 = location_data.get("display_name") or ""
         suburb = address.get("suburb") or address.get("neighbourhood") or address.get("village") or "Unknown"
         
         logger.debug("Resolved location")
         
         return {
             "city": city,
             "pincode": pincode,
             "state": state,
             "address_line_2": address_line_2,
             "suburb": suburb,
             "latitude": latitude,
             "longitude": longitude
         }
     
     except requests.RequestException as e:
         logger.error(f"LocationIQ error: {str(e)}")
         return {
             "city": "",
             "pincode": "",
             "state": "",
             "address_line_2": "",
             "suburb": "Unknown",
             "latitude": latitude,
             "longitude": longitude
         }
 