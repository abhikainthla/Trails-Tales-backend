import { Server } from "socket.io";

const io = new Server(server, {
  cors: { origin: "*" },
});

export default io;
