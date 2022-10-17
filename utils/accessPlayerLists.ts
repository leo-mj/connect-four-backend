import { OnlinePlayer } from "./types";

export function getPlayerById(playerArray: OnlinePlayer[], id: string): OnlinePlayer {
  const player: OnlinePlayer = playerArray.filter(player => player.id === id)[0];
  return player;
}

export function removePlayerFromArray(playerArray: OnlinePlayer[], id: string): OnlinePlayer[] {
  const alteredArray: OnlinePlayer[] = playerArray.filter(player => player.id !== id);
  return alteredArray;
}


