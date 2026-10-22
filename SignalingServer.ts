import { Server, Socket } from "socket.io";
import { ExpressPeerServer } from "peer";
import { Server as HttpServer } from "http";

export interface UserData {
  socketId: string;
  peerId: string;
  userName: string;
  profilePic?: string;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

export function setupSignalingServer(httpServer: HttpServer, app: any) {
  // 1. Setup PeerJS Server
  const peerServer = ExpressPeerServer(httpServer, {
    path: "/",
    proxied: true
  });
  app.use("/peerjs", peerServer);

  // 2. Setup Socket.io for Discovery and Room State
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Defaults are pingInterval: 25000, pingTimeout: 20000. A few browsers
    // (esp. during the native getDisplayMedia screen-picker dialog) can
    // freeze a tab's JS long enough to blow through the default timeout,
    // which silently disconnects the socket, drops the user from the
    // room roster below, and broadcasts a false "user-left" to everyone
    // else even though the user never actually left. Widen the window.
    pingInterval: 25000,
    pingTimeout: 30000
  });

  const rooms: Record<string, UserData[]> = {};
  const roomGoals: Record<string, Goal[]> = {};
  const roomNotes: Record<string, string> = {};
  const roomLines: Record<string, any[]> = {};
  const roomHosts: Record<string, string> = {}; // roomId -> peerId
  const roomLocked: Record<string, boolean> = {}; // roomId -> boolean
  const roomPins: Record<string, string> = {}; // roomId -> pin string
  const roomIsPrivate: Record<string, boolean> = {}; // roomId -> boolean

  io.on("connection", (socket: Socket) => {
    const transport = socket.conn.transport.name; // 'polling' or 'websocket'
    console.log(`User connected to signaling server. ID: ${socket.id}, Transport: ${transport}`);

    socket.conn.on("upgrade", () => {
      const upgradedTransport = socket.conn.transport.name;
      console.log(`User ${socket.id} upgraded transport to: ${upgradedTransport}`);
    });

    socket.on("check-room", (payload: { roomId: string }, callback?: (res: any) => void) => {
      const { roomId } = payload;
      const exists = !!rooms[roomId] && rooms[roomId].length > 0;
      const isPrivate = !!roomIsPrivate[roomId];
      const isLocked = !!roomLocked[roomId];
      const userCount = rooms[roomId]?.length || 0;
      const result = { exists, isPrivate, isLocked, userCount };
      if (typeof callback === "function") {
        callback(result);
      } else {
        socket.emit("check-room-response", { roomId, ...result });
      }
    });

    socket.on("join-room", (payload: { 
      roomId: string, 
      peerId: string, 
      userName: string, 
      profilePic?: string, 
      isCameraOff?: boolean, 
      isScreenSharing?: boolean,
      pin?: string,
      createPrivate?: boolean,
      initialPin?: string
    }) => {
      const { roomId, peerId, userName, profilePic, isCameraOff, isScreenSharing, pin, createPrivate, initialPin } = payload;
      
      // Check if room is locked
      if (roomLocked[roomId] && (!rooms[roomId] || !rooms[roomId].find(u => u.peerId === peerId))) {
        socket.emit("join-failed", { reason: "locked", roomId });
        return;
      }

      const roomExists = !!rooms[roomId] && rooms[roomId].length > 0;
      const isReconnectingUser = roomExists && !!rooms[roomId].find(u => u.peerId === peerId);

      // Private Room PIN Verification
      if (roomExists && roomIsPrivate[roomId] && !isReconnectingUser) {
        const expectedPin = roomPins[roomId];
        if (expectedPin && (!pin || pin.trim() !== expectedPin)) {
          console.log(`[ROOM JOIN REJECTED] Peer ${peerId} failed PIN check for private room ${roomId}`);
          socket.emit("join-failed", { 
            reason: "invalid-pin", 
            roomId, 
            requiresPin: true,
            message: pin ? "Mã PIN không chính xác" : "Phòng này yêu cầu mã PIN"
          });
          return;
        }
      }

      const userData: UserData = { 
        socketId: socket.id, 
        peerId, 
        userName, 
        profilePic,
        isCameraOff: isCameraOff ?? true,
        isScreenSharing: isScreenSharing ?? false
      };
      
      if (!rooms[roomId]) {
        rooms[roomId] = [];
        roomHosts[roomId] = peerId; // First user is the host
        roomLocked[roomId] = false;

        if (createPrivate && initialPin && initialPin.trim().length > 0) {
          roomIsPrivate[roomId] = true;
          roomPins[roomId] = initialPin.trim();
          console.log(`[ROOM CREATED] Private room created: ${roomId} with PIN by ${userName}`);
        } else {
          roomIsPrivate[roomId] = false;
          delete roomPins[roomId];
          console.log(`[ROOM CREATED] Public community room created: ${roomId} by ${userName}`);
        }
      }
      
      // Prevent duplicates
      const existingUserIndex = rooms[roomId].findIndex(u => u.peerId === peerId);
      if (existingUserIndex >= 0) {
        rooms[roomId][existingUserIndex] = userData;
      } else {
        rooms[roomId].push(userData);
      }
      
      socket.join(roomId);
      console.log(`[ROOM JOIN SUCCESS] User: ${userName}, PeerID: ${peerId}, RoomID: ${roomId}, Private: ${!!roomIsPrivate[roomId]}`);

      // Discovery: Inform the joiner of existing users
      const otherUsers = rooms[roomId].filter(u => u.socketId !== socket.id);
      socket.emit("all-users", otherUsers);
      
      // Room State Synchronization
      socket.emit("update-goals", roomGoals[roomId] || []);
      socket.emit("update-notes", roomNotes[roomId] || "");
      
      const isHost = roomHosts[roomId] === peerId;
      socket.emit("room-info", { 
        hostId: roomHosts[roomId], 
        isLocked: roomLocked[roomId] || false,
        isPrivate: !!roomIsPrivate[roomId],
        pin: isHost ? roomPins[roomId] : undefined
      });
      
      // Discovery: Inform existing users of the newcomer
      socket.to(roomId).emit("user-joined", { 
        peerId, 
        userName, 
        profilePic,
        isCameraOff: userData.isCameraOff,
        isScreenSharing: userData.isScreenSharing
      });
    });

    socket.on("request-all-users", (roomId: string) => {
      if (rooms[roomId]) {
        const otherUsers = rooms[roomId].filter(u => u.socketId !== socket.id);
        socket.emit("all-users", otherUsers);
      }
    });

    socket.on("update-user-name", (payload: { roomId: string, userName: string }) => {
      const { roomId, userName } = payload;
      if (rooms[roomId]) {
        const user = rooms[roomId].find(u => u.socketId === socket.id);
        if (user) {
          user.userName = userName;
          io.to(roomId).emit("user-updated-name", { peerId: user.peerId, userName });
        }
      }
    });

    socket.on("update-profile-pic", (payload: { roomId: string, profilePic: string }) => {
      const { roomId, profilePic } = payload;
      if (rooms[roomId]) {
        const user = rooms[roomId].find(u => u.socketId === socket.id);
        if (user) {
          user.profilePic = profilePic;
          io.to(roomId).emit("user-updated", {
            peerId: user.peerId,
            userName: user.userName,
            profilePic: user.profilePic
          });
        }
      }
    });

    socket.on("lock-room", (payload: { roomId: string, locked: boolean }) => {
      const { roomId, locked } = payload;
      const user = rooms[roomId]?.find(u => u.socketId === socket.id);
      if (user && roomHosts[roomId] === user.peerId) {
        roomLocked[roomId] = locked;
        io.to(roomId).emit("room-locked-update", { isLocked: locked });
      }
    });

    socket.on("set-room-security", (payload: { roomId: string, isPrivate: boolean, pin?: string }) => {
      const { roomId, isPrivate, pin } = payload;
      const user = rooms[roomId]?.find(u => u.socketId === socket.id);
      if (user && roomHosts[roomId] === user.peerId) {
        roomIsPrivate[roomId] = isPrivate;
        if (isPrivate && pin && pin.trim().length > 0) {
          roomPins[roomId] = pin.trim();
        } else if (!isPrivate) {
          delete roomPins[roomId];
        }

        // Send updated room info to each user (only host receives the plaintext pin)
        rooms[roomId]?.forEach(u => {
          const isHostUser = u.peerId === roomHosts[roomId];
          io.to(u.socketId).emit("room-info", {
            hostId: roomHosts[roomId],
            isLocked: roomLocked[roomId] || false,
            isPrivate: !!roomIsPrivate[roomId],
            pin: isHostUser ? roomPins[roomId] : undefined
          });
        });
      }
    });

    // Handle data channel relay (for those who don't want P2P data channels or as fallback)
    socket.on("add-goal", (payload: { roomId: string, goal: Goal }) => {
      if (!roomGoals[payload.roomId]) roomGoals[payload.roomId] = [];
      roomGoals[payload.roomId].push(payload.goal);
      io.to(payload.roomId).emit("update-goals", roomGoals[payload.roomId]);
    });

    socket.on("toggle-goal", (payload: { roomId: string, goalId: string }) => {
      if (roomGoals[payload.roomId]) {
        roomGoals[payload.roomId] = roomGoals[payload.roomId].map(g => 
          g.id === payload.goalId ? { ...g, completed: !g.completed } : g
        );
        io.to(payload.roomId).emit("update-goals", roomGoals[payload.roomId]);
      }
    });

    socket.on("delete-goal", (payload: { roomId: string, goalId: string }) => {
      if (roomGoals[payload.roomId]) {
        roomGoals[payload.roomId] = roomGoals[payload.roomId].filter(g => g.id !== payload.goalId);
        io.to(payload.roomId).emit("update-goals", roomGoals[payload.roomId]);
      }
    });

    socket.on("cursor-move", (payload: { roomId: string, x: number, y: number, userName: string }) => {
      socket.to(payload.roomId).emit("cursor-update", {
        socketId: socket.id,
        x: payload.x,
        y: payload.y,
        userName: payload.userName
      });
    });

    socket.on("draw-data", (payload: { roomId: string, data: { line: any } }) => {
      if (!roomLines[payload.roomId]) roomLines[payload.roomId] = [];
      
      const lineIndex = roomLines[payload.roomId].findIndex(l => l.id === payload.data.line.id);
      if (lineIndex >= 0) {
        roomLines[payload.roomId][lineIndex] = payload.data.line;
      } else {
        roomLines[payload.roomId].push(payload.data.line);
      }
      
      socket.to(payload.roomId).emit("draw-data", payload.data);
    });

    socket.on("request-whiteboard", (roomId: string) => {
      if (roomLines[roomId]) {
        roomLines[roomId].forEach(line => {
          socket.emit("draw-data", { line });
        });
      }
    });

    socket.on("clear-canvas", (roomId: string) => {
      roomLines[roomId] = [];
      socket.to(roomId).emit("clear-canvas");
    });

    
    socket.on("media-state", (payload: { roomId: string, peerId: string, isScreenSharing?: boolean, isCameraOff?: boolean }) => {
      if (rooms[payload.roomId]) {
        const user = rooms[payload.roomId].find(u => u.peerId === payload.peerId);
        if (user) {
          if (payload.isScreenSharing !== undefined) user.isScreenSharing = payload.isScreenSharing;
          if (payload.isCameraOff !== undefined) user.isCameraOff = payload.isCameraOff;
        }
      }
      socket.to(payload.roomId).emit("media-state", payload);
    });

    socket.on("send-message", (payload: { roomId: string, message: string, senderName: string }) => {
      socket.to(payload.roomId).emit("receive-message", {
        message: payload.message,
        senderId: socket.id,
        senderName: payload.senderName
      });
    });

    socket.on("send-reaction", (payload: { roomId: string, reaction: string, targetPeerId: string }) => {
      socket.to(payload.roomId).emit("receive-reaction", {
        reaction: payload.reaction,
        targetPeerId: payload.targetPeerId,
        senderId: socket.id
      });
    });

    socket.on("update-goals", (payload: { roomId: string, goals: Goal[] }) => {
      roomGoals[payload.roomId] = payload.goals;
      socket.to(payload.roomId).emit("update-goals", payload.goals);
    });

    socket.on("update-notes", (payload: { roomId: string, notes: string }) => {
      roomNotes[payload.roomId] = payload.notes;
      socket.to(payload.roomId).emit("update-notes", payload.notes);
    });

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (rooms[roomId]) {
          const user = rooms[roomId].find(u => u.socketId === socket.id);
          rooms[roomId] = rooms[roomId].filter(u => u.socketId !== socket.id);
          
          if (user && roomHosts[roomId] === user.peerId) {
            // Host is leaving, assign next person if any
            if (rooms[roomId].length > 0) {
              roomHosts[roomId] = rooms[roomId][0].peerId;
              const newHostPeerId = roomHosts[roomId];
              rooms[roomId].forEach(u => {
                const isHostUser = u.peerId === newHostPeerId;
                io.to(u.socketId).emit("room-info", { 
                  hostId: newHostPeerId, 
                  isLocked: roomLocked[roomId] || false,
                  isPrivate: !!roomIsPrivate[roomId],
                  pin: isHostUser ? roomPins[roomId] : undefined
                });
              });
            } else {
              delete roomHosts[roomId];
              delete roomLocked[roomId];
              delete roomPins[roomId];
              delete roomIsPrivate[roomId];
              delete rooms[roomId];
              delete roomGoals[roomId];
              delete roomNotes[roomId];
              delete roomLines[roomId];
            }
          }

          socket.to(roomId).emit("user-left", { 
            socketId: socket.id, 
            peerId: user?.peerId 
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from signaling server:", socket.id);
    });
  });

  return { io, peerServer };
}
