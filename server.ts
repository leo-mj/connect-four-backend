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
interface OnlinePlayer {
  username: string;
  id: string;
}

let onlinePlayers: OnlinePlayer[] = [];

io.on("connection", (socket: Socket) => {
  console.log("connected", socket.id);
  io.emit("players online updated", onlinePlayers);
    
  socket.on("reset", (opponent: OnlinePlayer) => {
    console.log("resetting");
    socket.to(opponent.id).emit("reset");
  });

  socket.on("cell click", (changedBoard: Board, player: 'A'|'B', opponent: OnlinePlayer) => {
    const lastPlayer: OnlinePlayer = onlinePlayers.filter(player => player.id === socket.id)[0];
    console.log(`${lastPlayer.username} just moved as ${player}`, "next move by:", opponent.username);
    socket.to(opponent.id).emit("cell clicked by", changedBoard, player);
  })

  socket.on("winner", (winner: 'A'|'B', opponent: OnlinePlayer) => {
    console.log(winner);
    socket.to(opponent.id).emit("game won by", winner);
  })


  socket.on("new player online", (username: string) => {
    console.log(username, "now online");
    const newPlayer: OnlinePlayer = {username: username, id: socket.id};
    onlinePlayers.push(newPlayer);
    io.emit("players online updated", onlinePlayers);
  })

  socket.on("challenge", (invitedPlayerId: string, username: string) => {
    socket.to(invitedPlayerId).emit("challenged", {username: username, id: socket.id});
  })

  socket.on("challenge accepted", (otherPlayerId) => {
    socket.to(otherPlayerId).emit("your challenge accepted", socket.id);
  })

  socket.on("disconnect", () => {
    const offlinePlayer = onlinePlayers.filter(player => player.id === socket.id)[0];
    if (offlinePlayer) {
      console.log(offlinePlayer.username, "is going offline");
    }
    onlinePlayers = onlinePlayers.filter(player => player.id !== socket.id);
    socket.broadcast.emit("players online updated", onlinePlayers);
  })

});






//Start the server on the given port
const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
