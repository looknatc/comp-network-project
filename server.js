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
    messages:[],
    time:0,
  }
];
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  findUser,
  userJoinSystem,
  getAllUserRoom,
  isUniqueUsername,
  getAllUsers
} = require("./utils/users");
// var myModule = require("./utils/users");
// var myUsers = myModule.myUsers;

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const moment = require('moment');

// // Set static folder
app.use(express.static(path.join(__dirname, "public"), {index: "login.html"}));
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
  // var to = obj.to;
  var from = obj.from;
  var msg = obj.msg;
  var time = obj.time;
  // var owner = getOwner(to,from);
  var owner = obj.room;
  for(i in dmStore){
    elem = dmStore[i];
    if(elem.owner == owner){
      elem.messages.push({
        content:msg,
        from:from,
        time:time
      })
      console.log(dmStore[i]);
      return
    }
  }
  dmStore.push({
    owner: owner,
    messages:[{
      content:msg,
      from:from,
      time:time
    }]
  })
  console.log(dmStore);
}

io.on("connection", (socket) => {

  // Welcome current user
  // socket.emit('message','Welcome to ChatCord!');

  // Listen for the checkUsername event
  socket.on('checkUsername', (username, callback) => {
    console.log(`Checking username: ${username}`);
    
    // Check if the username is unique
    const unique = isUniqueUsername(username);

    // Emit the uniqueUsername event with the boolean value
    callback(unique);

    if (unique) {
      // Add the username to the usernames array
      userJoinSystem(socket.id, username);
      const allUser = getAllUsers();
      io.emit("allUserResponse", allUser);
    } else{
      // console.log("usernameNotUnique");
      // socket.emit("usernameNotUnique",{msg:`your username is already used by ${username}, continue if you are ${username}.`});
    }
  });


  socket.on("startDM",({from})=>{
    console.log("allUser",getAllUsers());
    const user = userJoin(socket.id, from,"DM");
    const allUser = getAllUsers();
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
    var allUser = getAllUsers()
    io.emit("allUserResponse",allUser);
  });

  socket.on("directMessage",({content,to,from})=>{
    console.log("receive message from",to,"content is",content);
    // var sendTime = moment().format('h:mm a');
    var sendTime = moment().format("YYYY-MM-DD H:mm a");
    var owner = getOwner(to,from);
    insertMessage({
      room:owner,
      from:from,
      msg:content,
      time:sendTime
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
    const allUser = getAllUsers();
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

    var allUser = getAllUsers()
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
      var allUser = getAllUsers()
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
  socket.on("getPastMessages",(roomName)=>{
    console.log("getPastMessages",roomName.roomName);
    console.log(roomName);
    var ret;
    for(i in dmStore){
      console.log("dmStore[i]",dmStore[i],dmStore[i].owner,roomName.roomName);
      if(dmStore[i].owner === roomName.roomName){
        console.log("find ret",ret);
        ret = dmStore[i].messages;
        break;
      }
    }
    // var ret= dmStore.filter(room => room.owner === roomName);
    console.log("ret",ret);
    socket.emit("getPastMessagesResponse",{ret});
  });
  socket.on("chatMessage", (msg) => {
    // console.log(msg);
    const user = getCurrentUser(socket.id);
    // var sendTime = moment().format('h:mm a');
    var sendTime =moment().format("YYYY-MM-DD H:mm a");
    insertMessage({
      room:user.room,
      from:user.username,
      msg:msg,
      time: sendTime
    });
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
