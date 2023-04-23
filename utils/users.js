//stroe users in each room {id, username, room}
const users = [];
//store all users in system {id, username}
var allUsers= [];

// function getAllUserRoom(targetRoom){
//   return users.filter((user) => user.room === targetRoom);
// }
function getRoom(username){
  return users.find((user) => user.username === username);
}
//return user in system
function getAllUsers(){
  return allUsers;
}

function allOnlineUsers(){
  const uniqueUsers = Array.from(new Set(users.map(user => user.username))).map(username => {
    return users.find(user => user.username === username);
  });
  return uniqueUsers
}

// user into chat room
function userJoin(id, username, room) {
  var user = findUser(username);
  if(user == undefined){
    user = { id, username, room, online:true };
    users.push(user);
    console.log("userJoin","add new",user);
  }else{
    user.id = id;
    user.room = room;
    user.online = true;
    console.log("userJoin","update",user);
  }
  return user;
}

//user join in system
function userJoinSystem(id, username) {
  const user = { id, username};

  allUsers.push(user);
  console.log("userJoinSystem ", allUsers);

  return user;
}

function findUser(username){
  for(i in users){
    if(users[i].username == username){
      console.log("findUser found:", users[i])
      return users[i];
    }
  }
}

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    //return users.splice(index, 1)[0];
    var user = users[index];
    user.online = false;    
  }
  console.log("userLeave",id,user);
  return user;
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room && user.online);
}

function isUniqueUsername(username){
  const existingUser = allUsers.find(user => user.username === username);
    if (existingUser) {
      return false;
    }
    return true;

}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers,
  findUser,
  userJoinSystem,
  // getAllUserRoom,
  isUniqueUsername,
  allOnlineUsers,
  users,
  getRoom
};
exports.allUsers = allUsers;
// exports.users = users;
