from django.db import models
from .citizens import CitizenProfile
from .admins import AdminProfile
from .governance import Department

class ComplaintGroup(models.Model):
    title = models.CharField(max_length=255)
    department = models.ForeignKey(Department,on_delete=models.PROTECT,related_name='complaint_groups',null=True,blank=True) # nullable (temporarily) once i shld reset db.sqlite3

    # Representative location (centroid)
    centroid_latitude = models.FloatField()
    centroid_longitude = models.FloatField()
    radius_meters = models.PositiveIntegerField(default=3000)
    grouped_status = models.CharField(
        max_length=20,
        choices=[
            ('OPEN', 'Open'),
            ('IN_PROGRESS', 'In Progress'),
            ('RESOLVED', 'Resolved'),
            ('CLOSED', 'Closed'),
        ],
        default='OPEN'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "complaint_groups"
    
    def __str__(self):
        return f"{self.department}-{self.grouped_status}-{self.centroid_latitude:.2f}:{self.centroid_longitude:.2f}"

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
        ('DRAFT', 'draft'),
    ]

    citizen = models.ForeignKey(CitizenProfile,on_delete=models.CASCADE,related_name='complaints')
    department = models.ForeignKey(Department,on_delete=models.PROTECT,related_name='complaints')

    # Address 
    address_line_1 = models.CharField(max_length=255,blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    landmark = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100,blank=True)
    pincode = models.CharField(max_length=20,blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField( null=True, blank=True)
    #  Complaint content
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    timestamp = models.DateTimeField(auto_now_add=True)
    group = models.ForeignKey(
        ComplaintGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints"
    )
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
    caption = models.CharField(max_length=255,null=True,blank=True)
    suggested_department = models.ForeignKey(Department,on_delete=models.PROTECT,related_name='evidences',null=True,blank=True)

    class Meta:
        db_table = 'evidences'
        verbose_name_plural = 'Evidences'
    
    def __str__(self):
        return f"{self.media_type} - {self.file.name}"

class GroupTimeline(models.Model):
    group = models.ForeignKey(ComplaintGroup,on_delete=models.CASCADE,related_name="timeline")
    admin = models.ForeignKey(AdminProfile,on_delete=models.CASCADE,related_name='timeline')

    title = models.CharField(max_length=255,null=True, blank=True)
    text = models.TextField(blank=True)
    image = models.ImageField(upload_to="group_timeline/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'timeline'
        verbose_name_plural = 'Timeline'
    
    def __str__(self):
        return f"{self.group} - {self.text}"
class ComplaintCount(models.Model):
    complaint = models.OneToOneField(
        Complaint,
        on_delete=models.CASCADE,
        related_name='count'
    )
    closed_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'complaint_counts'

    def __str__(self):
        return f"Complaint {self.complaint_id} - Closed {self.closed_count} times"
