"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter,URLRouter
import assistant.routing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# application = get_asgi_application() ###
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
application = ProtocolTypeRouter({
    "http":  get_asgi_application(),
    'websocket': URLRouter(
      assistant.routing.websocket_urlpatterns
    ),
    # Just HTTP for now. (We can add other protocols later.)
})
