const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const leaveButton = document.getElementById("leave-btn");
const roomList = document.getElementById("room");
const myName = document.getElementById("me");

// for search
const searchInput = document.querySelector("[data-search]");
const searchBtn = document.querySelector(".search-btn");
const searchBar = document.querySelector(".search-wrapper");
const searchIcon = document.querySelector(".fas fa-search");

// const rooms = ['Java','PHP']
// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// function outputMessage2(message) {
//   const div = document.createElement('div');
//   div.classList.add('message');
//   div.innerHTML = `<p class="meta">${message.from} <span>${message.time}</span></p>
//   <p class="text">
//     ${message.content}
//   </p>`;

//   document.querySelector('.chat-messages').appendChild(div);
// }
// console.log(username,room);

const socket = io();
// socket.on("connect", () => {
//   console.log(socket.id); // x8WIv7-mJelg7on_ALbx
// });
let prevdate = "";
// Join chatroom
socket.emit("joinRoom", { username, room });
socket.emit("getPastMessages", { roomName: room });
socket.on("getPastMessagesResponse", (response) => {
  console.log("PastMessagesResponse");
  console.log(response);
  for (i in response.ret) {
    const newdate = response.ret[i].time.split(" ");
    if (prevdate !== newdate[0]) {
      prevdate = newdate[0];
      outputDate(newdate[0]);
    }
    console.log(i, response.ret[i]);
    outputMessage(response.ret[i]);
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  console.log(message);
  const newdate = message.time.split(" ");
  if (prevdate !== newdate[0]) {
    prevdate = newdate[0];
    outputDate(newdate[0]);
  }
  if (message.from === "Chatshire Bot") {
    const div = document.createElement("div");
    div.classList.add("chatbot-message");
    div.innerHTML = `<p class="meta">${message.content}</p>`;
    document.querySelector(".chat-messages").appendChild(div);
  } else {
    outputMessage(message);
  }

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  const msg = e.target.elements.msg.value;
  // console.log(msg);

  // msg = msg.trim();

  //   if (!msg) {
  //     return false;
  //   }

  // Emit message to server
  socket.emit("chatMessage", msg);

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  const time = message.time.split(" ");
  if (message.from === username) {
    div.classList.add("message-sender");
    div.innerHTML = `<p class="meta">${message.from} <span>${
      time[1] + " " + time[2]
    }</span></p> 
  <p class="text">
    ${message.content}
  </p>`;
  } else {
    div.classList.add("message-receiver");
    div.innerHTML = `<p class="meta">${message.from} <span>${
      time[1] + " " + time[2]
    }</span></p> 
    <p class="text">
      ${message.content}
    </p>`;
  }

  // const p = document.createElement('p');
  // p.classList.add('meta');
  // p.innerText = message.username;
  // p.innerHTML += `<span>${message.time}</span>`;
  // div.appendChild(p);
  // const para = document.createElement('p');
  // para.classList.add('text');
  // para.innerText = message.text;
  // div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}
socket.on("directMessage", (x) => {
  console.log("directMessage", x);
});

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users
      .map(
        (user) => `<li><i class = "fas fa-user-alt"></i> ${user.username}</li>`
      )
      .join("")}
  `;

  myName.innerHTML = `${username}`;
  // userList.innerHTML = '';
  // users.forEach((user) => {
  //   const li = document.createElement('li');
  //   li.innerText = user.username;
  //   userList.appendChild(li);
  // });
}

// //Prompt the user before leave chat room
leaveButton.addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");

  if (leaveRoom) {
    window.location = "../index.html?username=" + username;
  } else {
  }
});

// add Date to chat panel
function outputDate(date) {
  const div = document.createElement("div");
  div.classList.add("chat-date");
  div.innerHTML = `<p class="meta">${date}</p> `;
  document.querySelector(".chat-messages").appendChild(div);
}
/*
############################
    search function
############################
*/

var matchingMessage = [];
let currentIdx = -1;

const clearMessage = () => {
  for (var i = 0; i < matchingMessage.length; i++) {
    matchingMessage[i].setAttribute("class", "text");
  }
};

searchBtn.addEventListener("click", (e) => {
  if (searchBar.className == "search-wrapper show") {
    clearMessage();
  }
  searchBar.classList.toggle("show");
});

document.addEventListener("click", function (event) {
  // If the user clicked outside of the search bar, hide it
  console.log(searchBar);
  if (
    searchBar.className == "search-wrapper show" &&
    !searchBar.contains(event.target) &&
    event.target !== searchBtn &&
    event.target !== searchBar &&
    event.target.className != "fas fa-search"
  ) {
    searchBar.classList.toggle("show");
    clearMessage();
  }
});
// Click Enter after fill in the search bar

searchInput.addEventListener("search", (e) => {
  e.preventDefault();
  currentIdx = -1;
  const value = e.target.value;
  const allMessages = document.querySelectorAll(".chat-messages .text");
  if (value == "") {
    clearMessage();
  }

  for (var i = 0; i < allMessages.length; i++) {
    // messageSender[i].scrollIntoView();
    if (value != "" && allMessages[i].textContent.includes(value)) {
      allMessages[i].setAttribute("class", "highlight-text");
      matchingMessage.push(allMessages[i]);
    } else {
      allMessages[i].setAttribute("class", "text");
    }
  }
});
// for scroll to the result of search
searchInput.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key == "ArrowUp") {
    next();
  }
  if (key == "ArrowDown") {
    previous();
  }
});

const next = () => {
  currentIdx = currentIdx + 1 > matchingMessage.length - 1 ? 0 : currentIdx + 1;
  matchingMessage[currentIdx].scrollIntoView();
};

const previous = () => {
  currentIdx = currentIdx - 1 < 0 ? matchingMessage.length - 1 : currentIdx - 1;
  matchingMessage[currentIdx].scrollIntoView();
};
