import { serve } from "https://deno.land/std@0.75.0/http/server.ts";
import {
  acceptWebSocket,
  WebSocket,
} from "https://deno.land/std@0.75.0/ws/mod.ts";

const server = serve(":8080");
console.log(`Chat server is running on 8080`);

let users: WebSocket[] = [];

for await (const req of server) {
  try {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    let socket = await acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    });

    try {
      handleWs(socket);
    } catch (err) {
      console.error(`failed to receive frame: ${err}`);

      if (!socket.isClosed) {
        await socket.close(1000).catch(console.error);
      }
    }
  } catch (error) {
    try {
      let headers = new Headers();
      let data;

      if (req.url === "/" || req.url === "/index.html") {
        headers.set("Content-Type", "text/html");
        data = await Deno.readTextFile("index.html");
      } else if (req.url === "/styles.css") {
        headers.set("Content-Type", "text/css");
        data = await Deno.readTextFile("styles.css");
      } else if (req.url === "/frontend.js") {
        headers.set("Content-Type", "text/javascript");
        data = await Deno.readTextFile("frontend.js");
      } else {
        throw 404;
      }

      await req.respond({ status: 200, body: data, headers: headers });
    } catch {
      await req.respond({ status: 404 });
    }
  }
}

async function handleWs(socket: WebSocket) {
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
            message: "Welcome to v1perchat!",
          },
        }));
      }
    }
  }
}
