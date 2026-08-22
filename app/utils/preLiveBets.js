/**
 * Filter daily-bets that match a specific game by Home/Away.
 * @param {Array|null|undefined} bets  daily-bets array from the API
 * @param {{ Home: string, Away: string }} game  game object
 * @returns {Array} matching bets
 */
export function filterBetsForGame(bets, game) {
  if (!bets || !game?.Home || !game?.Away) return []
  return bets.filter((bet) => bet.Home === game.Home && bet.Away === game.Away)
}
