const WebSocket = require('ws');
const ip = require('ip');

// Create a WebSocket server
const wss = new WebSocket.Server({ host: '0.0.0.0', port: 1234 });
console.log('Listening on', ip.address(), 'port 1234...');

// Maintain a list of all connected clients
let clients = [];

wss.on('connection', (ws) => {
  // Generate a unique identifier for the client
  const clientId = generateUniqueId();
  console.log('Client connected:', clientId);

  // Add the client to the list
  clients.push({ id: clientId, socket: ws });

  // Send the initial message to the client with identifier and color
  ws.send(JSON.stringify({ id: clientId, color: generateRandomColor() }));

  // When a client sends a message
  ws.on('message', (message) => {
    console.log(message.toString());
    // Parse the message from the client
    const parsedMessage = JSON.parse(message.toString());
    const senderId = parsedMessage.id;
    const color = getClientColor(senderId);
    console.log(parsedMessage);
    const data = JSON.stringify({ x: parsedMessage.x, y: parsedMessage.y, color: color });

    // Broadcast the message to all connected clients
    clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        // Include client identifier and modified data in the message
        client.socket.send(JSON.stringify({ id: senderId, data: data }));
      }
    });
  });

  // When a client disconnects
  ws.on('close', () => {
    clients = clients.filter((client) => client.id !== clientId);
    console.log('Client disconnected:', clientId);
  });
});

// Function to generate a unique identifier
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

// Function to retrieve the color associated with a client
function getClientColor(clientId) {
  const client = clients.find((client) => client.id === clientId);
  return client ? client.color : null;
}

// Function to generate a random color
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
