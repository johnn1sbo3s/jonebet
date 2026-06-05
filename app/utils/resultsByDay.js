import { groupBy, forEach, map, sum } from 'lodash';

export function resultsByDay(betsToShow) {
  let resultsByDay = groupBy(betsToShow, "Date");

  const profitByDay = {};
  let profitSum = 0;

  forEach(resultsByDay, (apostasDia, date) => {
    const profit = map(apostasDia, "Profit");
    const gameCount = apostasDia.length;
    profitSum += sum(profit);
    profitByDay[date] = {
      profit: profitSum,
      gameCount: gameCount,
    };
  });

  return profitByDay;
}
