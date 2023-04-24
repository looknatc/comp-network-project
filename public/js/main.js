const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const leaveButton = document.getElementById("leave-btn");
const roomList = document.getElementById("room");
const myName = document.getElementById("me");
var id = 0;

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
  socket.emit("chatMessage", { msg, id });

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});



// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  const time = message.time.split(" ");
  div.id = `${message.from} ${id}`;
  id += 1;
  if (message.from === username) {
    div.classList.add("message-sender");

    div.onclick = function () {
      //const username = this.textContent.split(' ')[0];
      if (confirm("Are you sure you want to unsend this message?")) {
        //remove the <p> component
        this.removeChild(this.firstElementChild);
        this.removeChild(this.firstElementChild);

        this.classList.remove("message-sender");
        this.classList.add("chatbot-message");
        this.innerHTML = `<p class="meta">${username} has unsend the message</p>`;

        //Emit unsend message to server
        socket.emit("unsendMessage", {
          id: this.id.split(' ')[1],
          room: room,
          messageId: this.id, // the ID of the message being unsent
          username: username, // the username of the sender
        });

        alert("Message successfully unsent!");
      } else {
        alert("Message not unsent.");
      }
    };
    div.innerHTML = `<p class="meta">${message.from} <span>${time[1] + " " + time[2]
      }</span></p> 
  <p class="text">
    ${message.content}
  </p>`;
  } else {
    div.classList.add("message-receiver");
    div.innerHTML = `<p class="meta">${message.from} <span>${time[1] + " " + time[2]
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

socket.on("unsendMessage", data => {
  console.log("Unsend from main.js ", data);
  if (data.username != username) {
    const div = document.getElementById(`${data.messageId}`);
    div.classList.remove("message-receiver");
    div.classList.add("chatbot-message");
    div.innerHTML = `<p class="meta">${data.username} has unsend the message</p>`;
  }
});


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
  // const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  // const urlParams = new URLSearchParams(window.location.search);
  // const username = urlParams.get("username");

  // if (leaveRoom) {
  //   window.location = "../index.html?username=" + username;
  // } else {
  // }
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  window.location = "../index.html?username=" + username;

});

// add Date to chat panel
function outputDate(date) {
  const div = document.createElement("div");
  div.classList.add("chat-date");
  div.innerHTML = `<p class="meta">${date}</p> `;
  document.querySelector(".chat-messages").appendChild(div);
}
