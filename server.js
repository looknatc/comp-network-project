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
const messageStorage = [
  {
    owner: "A_person1_B_person2",
    messages:[],
    time:0,
    unRead:0
  }
];
const readStatus = [
  {
    username:"xxxx",
    rooms:[{
      sender:"A?person1?B?person2",
      status:0,
    }
    ]
  }
]
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  findUser,
  userJoinSystem,
  getAllUserRoom,
  isUniqueUsername,
  getAllUsers,
  allOnlineUsers,
  users,
  getRoom
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
function updateRead(username,sender,status){
  console.log("server: update read: (username,sender,status)",username,sender,status)
  const user = readStatus.find(user => user.username === username);
  if (user) {
    const room = user.rooms.find(room => room.sender === sender);
    if (room) {
       room.status = status
      // console.log(room);
    } else {

      var newroom = { sender, status };
      user.rooms.push(newroom);
      // console.log("Room not found for sender 'y'");
    }
  } else {
    var newuser = { username, rooms: [{ sender, status }] };
    readStatus.push(newuser);
    // console.log("User not found for username 'xxxx'");
  }

  // for(i in readStatus){
  //   elem = readStatus[i];
  //   if(elem.username == username){
  //     const roomWithSenderY = rooms.find(room => room.sender === "y");
  //   }
  // }
}
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
  for(i in messageStorage){
    elem = messageStorage[i];
    if(elem.owner == owner){
      elem.messages.push({
        content:msg,
        from:from,
        time:time
      })
      console.log("server: insertMessage",messageStorage[i]);
      return
    }
  }
  messageStorage.push({
    owner: owner,
    messages:[{
      content:msg,
      from:from,
      time:time,
    }],
    
  })
  console.log("server: insertMessage (new owner)",messageStorage);
}
function showAllUserAndOnlineUser(){
  var allUser = getAllUsers()
  io.emit("allUserResponse",allUser);
  var allOnlineUser = allOnlineUsers();
  // console.log("allOnlineUserResponse",user)
  io.emit("allOnlineUserResponse",{allOnlineUser});
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
      userJoin(socket.id, username,"DM")
      
      userJoinSystem(socket.id, username);
      // const allUser = getAllUsers();
      // io.emit("allUserResponse", allUser);
      showAllUserAndOnlineUser()
      
    } else{
      // console.log("usernameNotUnique");
      // socket.emit("usernameNotUnique",{msg:`your username is already used by ${username}, continue if you are ${username}.`});
    }
  });

  socket.on("readStatus",({username})=>{
    console.log('server: readStatus',readStatus)
    var result = readStatus.find(user => user.username === username)
    if(result){
      socket.emit("readStatus",result);
    }
    

  });


  // socket.on("startDM",({from})=>{
  //   console.log("allUser",getAllUsers());
  //   const user = userJoin(socket.id, from,"DM");
  //   const allUser = getAllUsers();
  //   console.log(user,allUser)
  //   io.emit("allUserResponse",allUser);
  // });

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
    // var allUser = getAllUsers()
    // io.emit("allUserResponse",allUser);
    showAllUserAndOnlineUser()
  });

  socket.on("directMessage",({content,to,from})=>{
    console.log("server: directMessage: receive message from",to,"content is",content);
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
    console.log("server: userJoin: ",username)
    const user = userJoin(socket.id, username,"DM");
    // const allOnlineUser = allOnlineUsers();
    // const allUser = getAllUsers();
    // console.log(user,allUser)
    // io.emit("allUserResponse",{allUser,allOnlineUser});
    showAllUserAndOnlineUser()
  });


  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    console.log("server joinRoom updateRead",user.username,user.room,0)
    updateRead(user.username,user.room,0)//status read
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
    
    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message',formatMessage(botName,  `${user.username} has joined the chat`))
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });

    // var allUser = getAllUsers()
    // io.emit("allUserResponse",allUser);
    showAllUserAndOnlineUser()
    

      // .to(user.room)
      // .emit(
      //   "message",
      //   formatMessage(botName, `${user.username} has joined the chat`)
  });
  // Runs when client disconnects
  socket.on('disconnect',()=>{
    console.log("disconnect called printusers",users)
    const user = userLeave(socket.id);
    console.log("disconnec userLeave",user)
    if(user){
      io.to(user.room).emit(
        'message',
        formatMessage(botName,  `${user.username} has left the chat`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
      // var allUser = getAllUsers()
      // io.emit("allUserResponse",allUser);
      // var allOnlineUser = allOnlineUsers();
      // console.log("allOnlineUserResponse",user)
      // io.emit("allOnlineUserResponse",allOnlineUser);
      showAllUserAndOnlineUser()

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
  socket.on("getPastMessages",({roomName})=>{
    console.log("server: getPastMessages",roomName);
    // console.log(roomName);
    var ret;
    for(i in messageStorage){
      console.log("messageStorage[i]",messageStorage[i],messageStorage[i].owner,roomName);
      if(messageStorage[i].owner === roomName){
        
        ret = messageStorage[i].messages;
        console.log("find ret",ret);
        break;
        
      }
    }
    // var ret= messageStorage.filter(room => room.owner === roomName);
    console.log("getPastMessages",ret);
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
    // nat
    console.log("chatMessage user.room",user.room)
    //also alert to index.html if user not join room
    if (/^([^?]+\?){3}[^?]+$/.test(user.room)) {
      const arr = user.room.split("?");
      console.log("server: room name split" ,arr); // ["xxx", "yyyyy", "xxxxx", "yyyyyy"]
      var toUser = arr[1]
      if(user.username == arr[1]){
        toUser = arr[3]
      }
      room = getRoom(toUser)
      if(room){
        console.log("getRoom(toUser)",room)
        if(room.room == "DM"){
          updateRead(toUser,user.room,1)//status 1 = has unread
          io.to(room.id).emit("alertDM",formatMessage(user.username, msg))
        }
      }
      else{
        updateRead(toUser,user.room,1)
      }
      
      // else{
      //   // io.to(user.room).emit("message",formatMessage(user.username, msg))
      // }
    }
    // } else {
    //   //send to rooms
    //   io.to(user.room).emit("message",formatMessage(user.username, msg))
    // }
    
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
