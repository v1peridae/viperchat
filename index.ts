const server = Deno.serve({ port: 8000 });
console.log(`Server is running on http://localhost:8000/`);

let users: WebSocket[] = [];

for await (const req of server) {
  try {
    if (req.url === "/assets/viperchat.png") {
      try {
        const img = await Deno.readFile('./assets/viperchat.png');
        const headers = new Headers();
        headers.set('content-type', 'image/png');
        req.respond({ headers, body: img, status: 200 });
      } catch (_error) {
        console.error("Error serving image:", _error);
        req.respond({ status: 404, body: "Image not found" });
      }
    } else if (req.url === "/ws") {
      const { response, socket } = Deno.upgradeWebSocket(req);
      req.respond(response);
      handleWs(socket);
    } else {
      req.respond({ status: 404, body: "Not Found" });
    }
  } catch (err) {
    console.error(`Error handling request: ${err}`);
    req.respond({ status: 500, body: "Internal Server Error" });
  }
}

function handleWs(socket: WebSocket) {
  users.push(socket);
  socket.onmessage = (event) => {
    console.log("Message from client:", event.data);
    // Broadcast message to all connected users
    for (const user of users) {
      user.send(event.data);
    }
  };

  socket.onclose = () => {
    users = users.filter((user) => user !== socket);
    console.log("Client disconnected");
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}