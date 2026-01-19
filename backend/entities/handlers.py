from django.db import models
from django.conf import settings  # for AUTH_USER_MODEL
from .governance import Department

class HandlerProfile(models.Model):
    # Connects directly to the  base/User model
    user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="handler_profile")
    designation = models.CharField(max_length=255, blank=True)
    # Foreign key to Department
    department = models.ForeignKey(Department,on_delete=models.SET_NULL,null=True,blank=True,related_name="handlers")

    class Meta:
        db_table = "handlers"

    def __str__(self):
        return f"{self.user.username} ({self.designation})"
