from django.db import models
from .citizens import CitizenProfile
from .governance import Department

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    citizen = models.ForeignKey(CitizenProfile,on_delete=models.CASCADE,related_name='complaints')
    department = models.ForeignKey(Department,on_delete=models.PROTECT,related_name='complaints')

    # Address 
    address_line_1 = models.CharField(max_length=255,blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    landmark = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100,blank=True)
    pincode = models.CharField(max_length=20,blank=True)

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    #  Complaint content
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    timestamp = models.DateTimeField(auto_now_add=True)

    # Users Interaction
    likes_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'complaints'
        ordering = ['-timestamp']

    def __str__(self):
        return self.title

class Comment(models.Model):
    complaint = models.ForeignKey(Complaint,on_delete=models.CASCADE,related_name='comments')
    user = models.ForeignKey(CitizenProfile,on_delete=models.CASCADE,related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user} on {self.complaint_id}" # type: ignore

class Evidence(models.Model):
    MEDIA_TYPE_CHOICES = [('image', 'Image'),('video', 'Video'),('document', 'Document'),('audio', 'Audio'),]
    complaint = models.ForeignKey(Complaint,on_delete=models.CASCADE,related_name='evidences')
    file = models.FileField(upload_to='evidences/',null=True, blank=True)
    media_type = models.CharField(max_length=50, choices=MEDIA_TYPE_CHOICES)
    class Meta:
        db_table = 'evidences'
        verbose_name_plural = 'Evidences'
    
    def __str__(self):
        return f"{self.media_type} - {self.file.name}"

