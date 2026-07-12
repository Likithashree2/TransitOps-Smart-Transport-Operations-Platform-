import { io } from "socket.io-client";
import { USE_DEMO_DATA } from "./api";

export const socket = USE_DEMO_DATA
  ? null
  : io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      autoConnect: false,
      transports: ["websocket"]
    });
