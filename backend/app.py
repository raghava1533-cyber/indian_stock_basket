from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from services.market_stream import start_stream

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

# START BACKGROUND STREAM
start_stream(socketio)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=10000)