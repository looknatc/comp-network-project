const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
// const createAdapter = require("@socket.io/redis-adapter").createAdapter;
// const redis = require("redis");
// require("dotenv").config();
// const { createClient } = redis;

// {A_person1_B_person2:[] }
const dmStore = [
  {
    owner: "A_person1_B_person2",
    messages:[]
  }
];
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  allUsers,
  findUser,
  myUserJoin,
  myAllUsers
} = require("./utils/users");
// var myModule = require("./utils/users");
// var myUsers = myModule.myUsers;

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
function getOwner(a,b){
  if(a<b){
    return "A?"+a+"?B?"+b;
  }else{
    return "A?"+b+"?B?"+a;
  }
}
function insertMessage(obj){
  var to = obj.to;
  var from = obj.from;
  var msg = obj.msg;
  var owner = getOwner(to,from);
  for(i in dmStore){
    elem = dmStore[i];
    if(elem.owner == owner){
      elem.messages.push({
        content:msg,
        from:from
      })
      console.log(dmStore[i]);
      return
    }
  }
  dmStore.push({
    owner: owner,
    messages:[{
      content:msg,
      from:from
    }]
  })
  console.log(dmStore);
}

io.on("connection", (socket) => {
  // console.log('New WS Connection...');

  // Welcome current user
  // socket.emit('message','Welcome to ChatCord!');
  socket.on("startDM",({from})=>{
    console.log("allUser",allUsers());
    const user = userJoin(socket.id, from,"DM");
    // const user = myUserJoin(socket.id, username);
    const allUser = allUsers();
    console.log(user,allUser)
    io.emit("allUserResponse",allUser);
  });

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
    var owner = getOwner(to,from);
    insertMessage({
      to:to,
      from:from,
      msg:content
    });
    toUser = findUser(to);
    console.log("toUser",toUser);
    // console.log(getOwner(to,from),getOwner(from,to));
    socket.to(toUser.id).emit("directMessage",{
      content,
      from: from,
      fromSocket:socket.id,
    });
  });

  socket.on("userJoin",({username})=>{
    console.log("userJoin",username)
    const user = userJoin(socket.id, username,"DM");
    // const user = myUserJoin(socket.id, username);
    const allUser = allUsers();
    console.log(user,allUser)
    io.emit("allUserResponse",allUser);
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
    console.log("disconnect",user)
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
