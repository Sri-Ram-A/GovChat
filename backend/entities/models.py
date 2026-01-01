# entities/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username
