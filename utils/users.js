//stroe users in each room {id, username, room}
const users = [];
//store all users in system {id, username}
var allUsers= [];

function getAllUserRoom(targetRoom){
  return users.filter((user) => user.room === targetRoom);
}

//return user in system
function getAllUsers(){
  return allUsers;
}

// user into chat room
function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  console.log(users);

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
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
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
  getAllUserRoom,
  isUniqueUsername
};
exports.allUsers = allUsers;
