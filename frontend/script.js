// pro frontend client for chat app (works with same backend)
const socket = io();

// DOM
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const nameInput = document.getElementById('nameInput');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');
const messages = document.getElementById('messages');
const usersList = document.getElementById('usersList');
const currentRoom = document.getElementById('currentRoom');
const currentUserDisplay = document.getElementById('currentUser');
const leaveBtn = document.getElementById('leaveBtn');

// initial state
let username = localStorage.getItem('cc_username') || (`User${Math.floor(Math.random()*1000)}`);
let room = 'General';
nameInput.value = username;
currentUserDisplay.querySelector ? currentUserDisplay.querySelector('span').textContent = username : (currentUserDisplay.textContent = `User: ${username}`);
currentRoom.querySelector('span').textContent = room;

// helper: escape
function e(s){ return String(s||'').replace(/[&<"'>]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[m]); }

// join default
socket.emit('joinRoom', { username, room });

joinBtn.addEventListener('click', () => {
  const nameVal = nameInput.value.trim();
  const r = roomInput.value.trim();
  if (!nameVal) return alert('Please enter your name');
  if (!r) return alert('Please enter a room name');
  // update state
  username = nameVal;
  localStorage.setItem('cc_username', username);
  socket.emit('leaveRoom');
  room = r;
  currentRoom.querySelector('span').textContent = room;
  currentUserDisplay.querySelector('span').textContent = username;
  socket.emit('joinRoom', { username, room });
  roomInput.value = '';
});

msgForm.addEventListener('submit', eEvent => {
  eEvent.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('chatMessage', text);
  // optimistic UI: append own message
  appendMessage({ author: username, text, time: new Date().toISOString(), me: true });
  msgInput.value = '';
});

socket.on('message', message => {
  // prevent double-adding system welcome if we already appended optimistic
  if (message.author === 'System') {
    appendSystem(message.text, message.time);
  } else {
    // only render if it's not our optimistic (compare by text+time)
    appendMessage(message);
  }
});

socket.on('roomUsers', ({ room: r, users }) => {
  usersList.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u;
    usersList.appendChild(li);
  });
  currentRoom.querySelector('span').textContent = r;
});

leaveBtn.addEventListener('click', () => {
  socket.emit('leaveRoom');
  messages.innerHTML = '';
  usersList.innerHTML = '';
  room = 'General';
  socket.emit('joinRoom', { username, room });
  currentRoom.querySelector('span').textContent = room;
});

// helpers
function appendSystem(text, time){
  const li = document.createElement('li');
  li.className = 'system';
  li.style.background = '#fff4e6';
  li.style.color = '#6a4a00';
  li.textContent = `[${new Date(time).toLocaleTimeString()}] ${text}`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

function appendMessage(message){
  // ignore if message was sent by this client and we already added (simple heuristic)
  const li = document.createElement('li');
  if (message.author === username) li.classList.add('me');
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = `<strong>${e(message.author)}</strong> • <span>${new Date(message.time).toLocaleTimeString()}</span>`;
  const txt = document.createElement('div');
  txt.className = 'msg-text';
  txt.innerHTML = e(message.text);
  li.appendChild(meta);
  li.appendChild(txt);
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

