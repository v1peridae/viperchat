const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.url.endsWith("/assets/viperchat.png")) {
      try {
        const img = await Deno.readFile('./assets/viperchat.png');
        const headers = new Headers();
        headers.set('content-type', 'image/png');
        return new Response(img, { headers, status: 200 });
      } catch (_error) {
        console.error("Error serving image:", _error);
        return new Response("Image not found", { status: 404 });
      }
    } else if (req.url.endsWith("/ws")) {
      const { response, socket } = Deno.upgradeWebSocket(req);
      handleWs(socket);
      return response;
    } else {
      return new Response("Not Found", { status: 404 });
    }
  } catch (err) {
    console.error(`Error handling request: ${err}`);
    return new Response("Internal Server Error", { status: 500 });
  }
};

const server = Deno.serve({ port: 8000 }, handler);
console.log(`Server is running on http://localhost:8000/`);

let users: WebSocket[] = [];

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