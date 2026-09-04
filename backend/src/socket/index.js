let io;

const initSocket = (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
        cors: {
            origin: "*", // allow all for MVP
            methods: ["GET", "POST", "PATCH"]
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);
        
        // Farmer joins room specific to their booking/token
        socket.on('join_booking', (bookingId) => {
            socket.join(`booking_${bookingId}`);
            console.log(`Socket ${socket.id} joined booking_${bookingId}`);
        });

        // Officer joins room specific to their center to see queue updates
        socket.on('join_center', (centerId) => {
            socket.join(`center_${centerId}`);
            console.log(`Socket ${socket.id} joined center_${centerId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
