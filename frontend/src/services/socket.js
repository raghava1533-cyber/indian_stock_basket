import { io } from "socket.io-client";

const SOCKET_URL = "https://your-render-url.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
});