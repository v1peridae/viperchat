import { serve } from "https://deno.land/std@0.75.0/http/server.ts";
import { acceptWebSocket, WebSocket } from "https://deno.land/std@0.75.0/ws/mod.ts";

const server = serve({ port: 8080 });
console.log(`Server is running on http://localhost:8080/`);

let users: WebSocket[] = [];

for await (const req of server) {
  try {
    if (req.url === "/assets/viperchat.png") {
      // Serve the image
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
      // Handle WebSocket connection
      try {
        const { conn, r: bufReader, w: bufWriter, headers } = req;
        const socket = await acceptWebSocket({
          conn,
          bufReader,
          bufWriter,
          headers,
        });

        handleWs(socket);
      } catch (err) {
        console.error(`Failed to accept WebSocket: ${err}`);
        req.respond({ status: 400 });
      }
    } else {
      // Serve other static files or handle other routes
      try {
        const filePath = req.url === "/" ? "/index.html" : req.url;
        const data = await Deno.readTextFile(`.${filePath}`);
        req.respond({ status: 200, body: data });
      } catch (_error) {
        console.error("Error serving file:", _error);
        req.respond({ status: 404, body: "Not found" });
      }
    }
  } catch (err) {
    console.error("Unhandled error:", err);
    req.respond({ status: 500, body: "Internal Server Error" });
  }
}

async function handleWs(socket: WebSocket) {
  try {
    for await (const event of socket) {
      if (typeof event === "string") {
        const parsedEvent = JSON.parse(event);
        if (parsedEvent.type === "open") {
          console.log("Connection established with a client.");
          users.push(socket);

          await socket.send(JSON.stringify({
            type: "message",
            data: {
              name: "Automatic",
              message: "Welcome (back) to viperchat",
            }
          }));
        } else if (parsedEvent.type === "message") {
          console.dir(parsedEvent);
          users = users.filter(user => {
            try {
              user.send(JSON.stringify(parsedEvent));
              return true;
            } catch { // User closed connection
              return false;
            }
          });
          console.log(`There ${users.length === 1 ? "is" : "are"} ${users.length} ${users.length === 1 ? "user" : "users"} online`);
        }
      }
    }
  } catch (err) {
    console.error("WebSocket error:", err);
    try {
      socket.close(1000, "Internal Server Error");
    } catch (closeErr) {
      console.error("Error closing WebSocket:", closeErr);
    }
  }
}