# https://youtu.be/8p4M-7VXhAU?si=YXv4HvNTtzCjM3lO
# from .complaints import Complaint
# from django.dispatch import receiver
# from django.db.models.signals import post_save, post_delete

# @receiver(post_save, sender=Complaint)
# def increase_like_count(sender, instance, created, **kwargs):
#     if created:
#         complaint = instance.complaint
#         complaint.likes_count += 1
#         complaint.save(update_fields=['likes_count'])

# @receiver(post_delete, sender=Complaint)
# def decrease_like_count(sender, instance, **kwargs):
#     complaint = instance.complaint
#     complaint.likes_count -= 1
#     complaint.save(update_fields=['likes_count'])