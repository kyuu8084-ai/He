const fs = require('fs');
let code = fs.readFileSync('SignalingServer.ts', 'utf8');

// Update UserData interface
code = code.replace(
  "export interface UserData {\n  socketId: string;\n  peerId: string;\n  userName: string;\n}",
  "export interface UserData {\n  socketId: string;\n  peerId: string;\n  userName: string;\n  profilePic?: string;\n}"
);

// Update join-room
code = code.replace(
  "socket.on(\"join-room\", (payload: { roomId: string, peerId: string, userName: string }) => {",
  "socket.on(\"join-room\", (payload: { roomId: string, peerId: string, userName: string, profilePic?: string }) => {"
);
code = code.replace(
  "const { roomId, peerId, userName } = payload;",
  "const { roomId, peerId, userName, profilePic } = payload;"
);
code = code.replace(
  "const userData: UserData = { socketId: socket.id, peerId, userName };",
  "const userData: UserData = { socketId: socket.id, peerId, userName, profilePic };"
);

// Update request-all-users payload mapping? wait, `rooms[roomId]` is `UserData[]`, so it automatically sends it.
// Let's also add update-profile-pic
const updateProfileCode = `
    socket.on("update-profile-pic", (payload: { roomId: string, profilePic: string }) => {
      const { roomId, profilePic } = payload;
      if (rooms[roomId]) {
        const user = rooms[roomId].find(u => u.socketId === socket.id);
        if (user) {
          user.profilePic = profilePic;
          socket.to(roomId).emit("user-updated", user);
        }
      }
    });
`;
code = code.replace(
  /    socket.on\("update-user-name",[\s\S]*?\}\);\n/,
  match => match + updateProfileCode
);

fs.writeFileSync('SignalingServer.ts', code);
