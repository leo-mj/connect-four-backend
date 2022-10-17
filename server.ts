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
let busyPlayers: OnlinePlayer[] = [];

function getPlayerById(playerArray: OnlinePlayer[], id: string): OnlinePlayer {
  const player: OnlinePlayer = playerArray.filter(player => player.id === id)[0];
  return player;
}

function removePlayerFromArray(playerArray: OnlinePlayer[], id: string): OnlinePlayer[] {
  const alteredArray: OnlinePlayer[] = playerArray.filter(player => player.id !== id);
  return alteredArray;
}

io.on("connection", (socket: Socket) => {
  console.log("connected", socket.id);
  io.emit("players online updated", onlinePlayers, busyPlayers);
    
  socket.on("reset", (opponent: OnlinePlayer) => {
    console.log("resetting");
    socket.to(opponent.id).emit("reset");
  });

  socket.on("cell click", (changedBoard: Board, player: 'A'|'B', opponent: OnlinePlayer) => {
    const lastPlayer: OnlinePlayer = getPlayerById(onlinePlayers, socket.id);
    console.log(`${lastPlayer.username} just moved as ${player},`, "next move by:", opponent.username);
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
    io.emit("players online updated", onlinePlayers, busyPlayers);
  })

  socket.on("challenge", (invitedPlayerId: string) => {
    const challenger: OnlinePlayer = getPlayerById(onlinePlayers, socket.id);
    const busyPlayer: OnlinePlayer = getPlayerById(busyPlayers, invitedPlayerId);
    console.log("busy player:", busyPlayer, (busyPlayer !== undefined));
    if (busyPlayer !== undefined) {
      socket.emit("player busy", busyPlayer);
    } else {
      socket.to(invitedPlayerId).emit("challenged", {username: challenger.username, id: challenger.id});
    }
  })

  socket.on("challenge accepted", (challengerId) => {
    const opponent: OnlinePlayer = getPlayerById(onlinePlayers, socket.id);
    const challenger: OnlinePlayer = getPlayerById(onlinePlayers, challengerId);
    socket.to(challengerId).emit("your challenge accepted", opponent);
    busyPlayers.push(opponent, challenger);
    io.emit("players online updated", onlinePlayers, busyPlayers);
  })

  socket.on("left game", (opponent: OnlinePlayer) => {
    const leavingPlayer: OnlinePlayer = getPlayerById(onlinePlayers, socket.id);
    console.log(leavingPlayer.username, "left the game against", opponent.username);
    socket.to(opponent.id).emit("opponent left game", leavingPlayer.username);
    busyPlayers = removePlayerFromArray(busyPlayers, leavingPlayer.id);
    busyPlayers = removePlayerFromArray(busyPlayers, opponent.id);
  })

  socket.on("disconnect", () => {
    const offlinePlayer: OnlinePlayer = getPlayerById(onlinePlayers, socket.id);
    if (offlinePlayer) {
      console.log(offlinePlayer.username, "is going offline");
    }
    busyPlayers = removePlayerFromArray(busyPlayers, socket.id);
    onlinePlayers = removePlayerFromArray(onlinePlayers, socket.id);
    socket.broadcast.emit("players online updated", onlinePlayers, busyPlayers);
  })

});






//Start the server on the given port
const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
