import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.socketorigin || "http://localhost:5173",
  },
});

const userSocketMap = {}; //keeps user socket id with userid

export const getReceiverid=(userId)=>userSocketMap[userId];

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // console.log(userId, socket.id);
  }

  io.emit("getOnlineUser", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUser", Object.keys(userSocketMap));
  });
});

export {app,server,io}
