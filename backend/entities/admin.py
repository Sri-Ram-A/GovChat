from .governance import Jurisdiction,Domain,Department
from .complaints import Complaint,Evidence,ComplaintGroup,GroupTimeline
from .admins import AdminProfile
from .citizens import CitizenProfile
from .handlers import HandlerProfile
from django.contrib import admin

admin.site.register(Jurisdiction)
admin.site.register(Domain)
admin.site.register(Department)
admin.site.register(AdminProfile)
admin.site.register(CitizenProfile)
admin.site.register(HandlerProfile)
admin.site.register(Complaint)
admin.site.register(ComplaintGroup)
admin.site.register(GroupTimeline)
admin.site.register(Evidence)
