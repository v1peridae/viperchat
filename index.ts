const server = Deno.serve({ port: 8000 });

console.log(`Server is running on http://localhost:8000/`);

let users: WebSocket[] = [];

for await (const req of server) {
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
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.addEventListener("open", () => {
      console.log("Connection established with a client.");
      users.push(socket);
    });

    socket.addEventListener("message", (event) => {
      const parsedEvent = JSON.parse(event.data);
      if (parsedEvent.type === "message") {
        users = users.filter(user => {
          try {
            user.send(JSON.stringify(parsedEvent));
            return true;
          } catch {
            return false;
          }
        });
        console.log(`There ${users.length === 1 ? "is" : "are"} ${users.length} ${users.length === 1 ? "user" : "users"} online`);
      }
    });

    req.respond(response);
  } else {
    try {
      const filePath = req.url === "/" ? "/index.html" : req.url;
      const data = await Deno.readTextFile(`.${filePath}`);
      req.respond({ status: 200, body: data });
    } catch (_error) {
      console.error("Error serving file:", _error);
      req.respond({ status: 404, body: "Not found" });
    }
  }
}
