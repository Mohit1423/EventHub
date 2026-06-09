let ioInstance = null;
const userSockets = new Map(); // Map of userId -> Set of socketIds

/**
 * Initialize Socket.io integration
 * @param {Server} io Socket.io server instance
 */
export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user ID with socket ID upon authentication message
    socket.on('register', (userId) => {
      if (!userId) return;
      
      const userIdStr = userId.toString();
      if (!userSockets.has(userIdStr)) {
        userSockets.set(userIdStr, new Set());
      }
      userSockets.get(userIdStr).add(socket.id);
      console.log(`User ${userIdStr} registered socket ${socket.id}`);
    });

    socket.on('join_event', (eventId) => {
      if (!eventId) return;
      socket.join(`event_${eventId}`);
      console.log(`Socket ${socket.id} joined room event_${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
      if (!eventId) return;
      socket.leave(`event_${eventId}`);
      console.log(`Socket ${socket.id} left room event_${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Clean up maps
      for (const [userId, socketIds] of userSockets.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          console.log(`Removed socket ${socket.id} from user ${userId}`);
          if (socketIds.size === 0) {
            userSockets.delete(userId);
          }
          break;
        }
      }
    });
  });
};

/**
 * Sends a real-time notification to a specific user if they are online
 * @param {string} userId Recipient user ID
 * @param {string} eventName Socket event (e.g. 'notification')
 * @param {Object} data Payload data
 */
export const sendRealtimeNotification = (userId, eventName, data) => {
  if (!ioInstance) return;

  const userIdStr = userId.toString();
  const socketIds = userSockets.get(userIdStr);

  if (socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => {
      ioInstance.to(socketId).emit(eventName, data);
    });
    console.log(`Realtime notification '${eventName}' sent to user ${userIdStr}`);
  } else {
    console.log(`User ${userIdStr} is offline. Realtime notification queued in DB.`);
  }
};

/**
 * Broadcasts an event to all users connected to a specific event room
 * @param {string} eventId The ID of the event room
 * @param {string} eventName Socket event name
 * @param {Object} data Payload data
 */
export const broadcastToEvent = (eventId, eventName, data = {}) => {
  if (!ioInstance) return;
  ioInstance.to(`event_${eventId}`).emit(eventName, data);
  console.log(`Broadcasted '${eventName}' to room event_${eventId}`);
};
