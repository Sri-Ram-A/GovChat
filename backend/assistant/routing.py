# chat/routing.py
from django.urls import re_path,path
from . import consumers

websocket_urlpatterns = [
    path('chat/', consumers.ChatConsumer.as_asgi()),
]