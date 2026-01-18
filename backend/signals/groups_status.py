# complaints/signals.py

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from entities.complaints import ComplaintGroup, Complaint


@receiver(pre_save, sender=ComplaintGroup)
def store_old_group_status(sender, instance, **kwargs):
    """
    Before saving, remember the old grouped_status
    so we can detect changes in post_save.
    """
    if not instance.pk:
        instance._old_grouped_status = None
        return

    try:
        old = sender.objects.get(pk=instance.pk)
        instance._old_grouped_status = old.grouped_status
    except sender.DoesNotExist:
        instance._old_grouped_status = None


@receiver(post_save, sender=ComplaintGroup)
def sync_complaint_status_with_group(sender, instance, created, **kwargs):
    """
    When a ComplaintGroup's grouped_status changes,
    update all related complaints in ONE query.
    """
    old_status = getattr(instance, "_old_grouped_status", None)
    new_status = instance.grouped_status

    # If created or status unchanged → do nothing
    if created or old_status == new_status:
        return

    # Bulk update related complaints
    Complaint.objects.filter(
        group=instance
    ).exclude(
        status=new_status  # avoid useless writes
    ).update(
        status=new_status
    )
