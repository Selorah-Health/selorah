"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        // User joins their specific room upon dashboard load
        socket.on('join_room', (uid) => {
            socket.join(uid);
            console.log(`Socket ${socket.id} joined room ${uid}`);
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
// Expose a helper to emit events to specific users
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
