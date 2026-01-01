from django.db import models

class Jurisdiction(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)  # e.g. BLR-KENG-001 
    location = models.CharField(max_length=255)
    class Meta:
        db_table = "jurisdictions"
        ordering = ["name"]
    def __str__(self):
        return self.name

class Domain(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)  
    # e.g. Roads, Water, Garbage, Electricity
    class Meta:
        db_table = "domains"
        ordering = ["name"]
    def __str__(self):
        return self.name
    
class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)  # e.g. KENG-MUN-ROADS
    contact_point = models.CharField(max_length=255)
    jurisdiction = models.ForeignKey(Jurisdiction,on_delete=models.CASCADE,related_name="departments")
    domains = models.ManyToManyField(Domain,related_name="departments")
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    office_address = models.TextField(blank=True)
    class Meta:
        db_table = "departments"
        ordering = ["name"]
        unique_together = ("code", "jurisdiction")
    def __str__(self):
        return f"{self.name} ({self.jurisdiction.name})"
