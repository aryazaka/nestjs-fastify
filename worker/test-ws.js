const io = require('socket.io-client');
const socket = io('http://localhost:5000'); // atau port backend ws kamu

console.log('Connecting to WS server...');

socket.on('connect', () => {
  console.log('Connected to WS server');
});

socket.on('company_created', (data) => {
  console.log('Received created company from WS:', data);
}); 
console.log('test 2');
socket.on('disconnect', () => {
  console.log('Disconnected');
});


