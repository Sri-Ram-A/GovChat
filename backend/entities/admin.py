from .governance import Jurisdiction,Domain,Department
from .admins import AdminProfile
from .citizens import CitizenProfile
from django.contrib import admin

admin.site.register(Jurisdiction)
admin.site.register(Domain)
admin.site.register(Department)
admin.site.register(AdminProfile)
admin.site.register(CitizenProfile)
