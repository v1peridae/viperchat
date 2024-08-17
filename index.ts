import { serve } from "https://deno.land/std@0.75.0/http/server.ts";
import { acceptWebSocket, WebSocket } from "https://deno.land/std@0.75.0/ws/mod.ts";

async function handler(req: Request): Promise<Response> {
  if (req.url === "/assets/viperchat.png") {
    try {
      const img = await Deno.readFile('./assets/viperchat.png');
      return new Response(img, {
        headers: { 'content-type': 'image/png' },
      });
    } catch (_error) {
      console.error("Error serving image:", _error);
      return new Response("Image not found", { status: 404 });
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

    return response;
  } else {
    try {
      const filePath = req.url === "/" ? "/index.html" : req.url;
      const data = await Deno.readTextFile(`.${filePath}`);
      return new Response(data, { status: 200 });
    } catch (_error) {
      console.error("Error serving file:", _error);
      return new Response("Not found", { status: 404 });
    }
  }
}

const server = Deno.serve({ port: 8000, handler });

console.log(`Server is running on http://localhost:8000/`);
