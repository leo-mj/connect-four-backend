import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";


const app = express();
const httpServer = createServer(app);

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler
const io = new Server(httpServer, {
  cors: {
      origin: "*",
  },
});
type Board = (null | "A" | "B")[][];

io.on("connection", (socket: Socket) => {
  console.log("connected")
  
  socket.on("reset", () => {
    console.log("resetting");
    io.emit("reset");
  });

  socket.on("cell click", (changedBoard: Board, player: 'A'|'B') => {
    console.log(changedBoard, player);
    socket.broadcast.emit("cell clicked by", changedBoard, player);
    socket.broadcast.emit("next player");
  })

  socket.on("winner", (winner: 'A'|'B') => {
    console.log(winner);
    socket.broadcast.emit("game won by", winner);
  })
});






//Start the server on the given port
const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
