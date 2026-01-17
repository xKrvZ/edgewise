import { Socket } from "socket.io";
import { SocketSession } from "./socket-session.interface";

export interface AuthenticatedSocket extends Socket {
  session?: SocketSession;
}
