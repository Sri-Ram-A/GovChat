# chat/consumers.py

import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
# from channels.consumer import AsyncConsumer


class ChatConsumer(WebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.room_name = None

    def connect(self):
        self.room_name = "ConversationalAI"
        # connection has to be accepted
        self.accept()

    def receive(self, text_data:str, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        self.send("Accha,What I think is"+message)
