const users = [];

function allUsers(){
  const uniqueUsers = Array.from(new Set(users.map(user => user.username))).map(username => {
    return users.find(user => user.username === username);
  });
  return uniqueUsers
}

// Join user to chat
function userJoin(id, username, room) {
  const user = { id, username, room };

  users.push(user);
  console.log(users);

  return user;
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

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  allUsers
};
