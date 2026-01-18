from django.db import models
from django.conf import settings  
from .governance import Department
class CitizenProfile(models.Model):
    GENDER_CHOICES = [('M', 'Male'),('F', 'Female')]
    # Connects directly to the  base/User model
    user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="citizen_profile")
    address = models.TextField(blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state_province = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    class Meta:
        db_table = "citizens"

    def __str__(self):
        return f"{self.user.username}"
