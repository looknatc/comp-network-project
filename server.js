const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
// const createAdapter = require("@socket.io/redis-adapter").createAdapter;
// const redis = require("redis");
// require("dotenv").config();
// const { createClient } = redis;
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  allUsers
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// // Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// (async () => {
//   pubClient = createClient({ url: "redis://127.0.0.1:6379" });
//   await pubClient.connect();
//   subClient = pubClient.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));
// })();

const roomList = ["roomA","roomB"]
// // Run when client connects
io.on("connection", (socket) => {
  // console.log('New WS Connection...');

  // Welcome current user
  // socket.emit('message','Welcome to ChatCord!');

  socket.on("roomList",()=>{
    console.log('get roomList');
    io.emit("roomListResponse",roomList);
  });

  socket.on("newRoom",({roomName}) =>{
    roomList.push(roomName);
    io.emit("roomListResponse",roomList);
  });

  socket.on("allUser",()=>{
    console.log('index: allUser');
    var allUser = allUsers()
    io.emit("allUserResponse",allUser);
  });

  socket.on("directMessage",({content,to,from})=>{
    console.log("receive message from",to,"content is",content);
    socket.to(to).emit("directMessage",{
      content,
      from: socket.id,
    });
  });


  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
    
    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message',formatMessage(botName,  `${user.username} has joined the chat`))
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });

    var allUser = allUsers()
    io.emit("allUserResponse",allUser);

      // .to(user.room)
      // .emit(
      //   "message",
      //   formatMessage(botName, `${user.username} has joined the chat`)
  });
  // Runs when client disconnects
  socket.on('disconnect',()=>{
    const user = userLeave(socket.id);

    if(user){
      io.to(user.room).emit(
        'message',
        formatMessage(botName,  `${user.username} has left the chat`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
      var allUser = allUsers()
      io.emit("allUserResponse",allUser);
    }

    
  });


//   console.log(io.of("/").adapter);
//   socket.on("joinRoom", ({ username, room }) => {
//     const user = userJoin(socket.id, username, room);

//     socket.join(user.room);

//     // Welcome current user
//     socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

//     // Broadcast when a user connects
//     socket.broadcast
//       .to(user.room)
//       .emit(
//         "message",
//         formatMessage(botName, `${user.username} has joined the chat`)
//       );

//     // Send users and room info
//     io.to(user.room).emit("roomUsers", {
//       room: user.room,
//     });
//   });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    // console.log(msg);
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message",formatMessage(user.username, msg))
    // const user = getCurrentUser(socket.id);

    // io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

//   // Runs when client disconnects
//   socket.on("disconnect", () => {
//     const user = userLeave(socket.id);

//     if (user) {
//       io.to(user.room).emit(
//         "message",
//         formatMessage(botName, `${user.username} has left the chat`)
//       );

//       // Send users and room info
//       io.to(user.room).emit("roomUsers", {
//         room: user.room,
//         users: getRoomUsers(user.room),
//       });
//     }
//   });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
