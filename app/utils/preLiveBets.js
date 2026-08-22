/**
 * Filter daily-bets that match a specific game by Home/Away.
 * @param {Array|null|undefined} bets  daily-bets array from the API
 * @param {{ home: string, away: string }} game  game object
 * @returns {Array} matching bets
 */
export function filterBetsForGame(bets, game) {
  if (!bets || !game?.home || !game?.away) return []
  return bets.filter((bet) => bet.Home === game.home && bet.Away === game.away)
}
