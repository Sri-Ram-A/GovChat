import requests
from django.utils import timezone
from faker import Faker
import logging
from entities.citizens import CitizenProfile
from entities.complaints import Complaint
from entities.governance import Department
from entities.governance import Jurisdiction

import serializer.citizens as citizens_serializer
import serializer.complaints as complaints_serializer
import serializer.base as base_serializer
import serializer.governance as governance_serializer
from .itt_client import itt

logger = logging.getLogger(__name__)
fake = Faker("en_IN")

LOCATIONIQ_KEY = "pk.371a6630b5644f04659e2e3a616ca5c2"


def validate_geolocation(latitude, longitude):
    """Validate latitude and longitude are present."""
    if not latitude or not longitude:
        return {"error": "latitude and longitude are required"}
    return None


def create_draft_complaint(citizen_profile, latitude, longitude):
    """Create a draft complaint with minimal data."""
    
    default_department = Department.objects.get(id=1)
    draft_complaint = Complaint.objects.create(
        citizen=citizen_profile,
        department=default_department,
        title=f"Draft - {timezone.now().strftime('%Y%m%d%H%M%S')}",
        description="",
        status="DRAFT",
        latitude=latitude,
        longitude=longitude
    )
    
    logger.debug("Created draft complaint | id=%s", draft_complaint.id)
    return draft_complaint


def resolve_location(latitude, longitude):
    """Resolve location using LocationIQ API."""
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
        
        logger.debug("Resolved location | city=%s | pincode=%s", city, pincode)
        
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
        logger.error("LocationIQ error: %s", str(e))
        return {
            "city": "",
            "pincode": "",
            "state": "",
            "address_line_2": "",
            "suburb": "Unknown",
            "latitude": latitude,
            "longitude": longitude
        }


def generate_jurisdiction_code(state, city, suburb):
    """Generate a jurisdiction code from location parts."""
    state_code = state[:2].upper() if state else "XX"
    city_code = city[:5].upper() if city else "XXXXX"
    suburb_code = suburb[:3].upper() if suburb else "XXX"
    return f"{state_code}-{city_code}-{suburb_code}"


def get_or_create_jurisdiction(location_info):
    """Get or create jurisdiction based on location."""
    
    jurisdiction_code = generate_jurisdiction_code(
        location_info["state"],
        location_info["city"],
        location_info["suburb"]
    )
    
    jurisdiction = Jurisdiction.objects.filter(code=jurisdiction_code).first()
    
    if not jurisdiction:
        jurisdiction = Jurisdiction.objects.create(
            name=location_info["suburb"],
            code=jurisdiction_code,
            location=location_info["address_line_2"]
        )
        logger.debug("Created new jurisdiction | code=%s | name=%s", 
                    jurisdiction_code, location_info["suburb"])
    else:
        logger.debug("Using existing jurisdiction | code=%s", jurisdiction_code)
    
    return jurisdiction


def analyze_image(file_obj, media_type):
    """Run AI analysis on image if applicable."""
    if not file_obj or media_type != "image":
        return None, None, 0.0
    

    
    logger.debug("Running AI image analysis...")
    image_bytes = file_obj.read()
    caption, pred_dept, confidence, inference_time = itt.generate_caption_from_bytes(image_bytes)
    
    logger.debug(
        "Inference | caption='%s' | dept='%s' | confidence=%.2f | time=%.3fs",
        caption, pred_dept, confidence, inference_time
    )
    
    # Reset file pointer for Django to save
    file_obj.seek(0)
    
    return caption, pred_dept, confidence


def generate_department_defaults(pred_dept, jurisdiction):
    """Generate default department data."""
    area_code = jurisdiction.code.split("-")[-1].upper()
    dept_code = pred_dept.replace(" ", "").upper()[:6] if pred_dept else "UNKWN"
    
    return {
        "name": pred_dept or "Unknown Department",
        "jurisdiction": jurisdiction,
        "code": f"{area_code}-{dept_code}",
        "contact_point": fake.name(),
        "contact_email": fake.company_email(),
        "contact_phone": fake.phone_number(),
        "office_address": jurisdiction.location,
    }


def get_or_create_department(pred_dept, jurisdiction):
    """Get or create department based on AI prediction."""
    
    if not pred_dept:
        dept_data = generate_department_defaults(None, jurisdiction)
        suggested_department = Department.objects.create(**dept_data)
        logger.debug("Created default department | code=%s", suggested_department.code)
        return suggested_department
    
    suggested_department = Department.objects.filter(
        name__iexact=pred_dept,
        jurisdiction=jurisdiction
    ).first()
    
    if not suggested_department:
        dept_data = generate_department_defaults(pred_dept, jurisdiction)
        suggested_department = Department.objects.create(**dept_data)
        logger.debug(
            "Created new department | name=%s | code=%s | jurisdiction=%s",
            suggested_department.name,
            suggested_department.code,
            jurisdiction.code
        )
    else:
        logger.debug(
            "Using existing department | name=%s | jurisdiction=%s",
            suggested_department.name,
            jurisdiction.code
        )
    
    return suggested_department


def update_draft_complaint(draft_complaint, location_info, caption, suggested_department):
    """Update draft complaint with resolved data."""
    draft_complaint.city = location_info["city"]
    draft_complaint.pincode = location_info["pincode"]
    draft_complaint.address_line_2 = location_info["address_line_2"]
    draft_complaint.description = caption or ""
    draft_complaint.department = suggested_department
    draft_complaint.save()


def prepare_response_data(draft_complaint, evidence, location_info, suggested_department, confidence):
    """Prepare the API response data."""
    jurisdiction_code = generate_jurisdiction_code(
        location_info["state"],
        location_info["city"],
        location_info["suburb"]
    )
    
    return {
        "draft_complaint_id": draft_complaint.id,
        "evidence_id": evidence.id,
        "suggestions": {
            "title": draft_complaint.description[:100] if draft_complaint.description else "Untitled Complaint",
            "description": draft_complaint.description or "",
            "department_id": suggested_department.id if suggested_department else None,
            "department_name": suggested_department.name if suggested_department else None,
            "confidence": round(confidence, 2),
            "city": location_info["city"],
            "pincode": location_info["pincode"],
            "address_line_2": location_info["address_line_2"],
            "jurisdiction_code": jurisdiction_code,
            "jurisdiction_name": location_info["suburb"],
            "latitude": str(location_info["latitude"]),
            "longitude": str(location_info["longitude"])
        }
    }