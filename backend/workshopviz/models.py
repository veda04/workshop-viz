import datetime
from django.db import models

# Create your models here.
class Booking(models.Model):
    machine_name = models.CharField(max_length=100)
    booked_by = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    booking_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        app_label = 'workshopviz'

    def __str__(self):
        return f"Booking for {self.machine_name} by {self.booked_by}"

    def get_current_booking(cls, machine_name):
        """Get current active booking for a machine"""
        now = datetime.now()
        current_date = now.date()
        current_time = now.time()

        try:
            return cls.objects.get('bookings').filter(
                machine_name__iextract=machine_name,
                booking_date=current_date,
                start_time__lte=current_time,
                end_time__gte=current_time
            ).first()
        except Exception:
            return None