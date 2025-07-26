import _ from 'lodash';

export function resultsByDay(betsToShow) {
  let resultsByDay = _.groupBy(betsToShow, "Date");

  const profitByDay = {};
  let profitSum = 0;

  _.forEach(resultsByDay, (apostasDia, date) => {
    const profit = _.map(apostasDia, "Profit");
    const gameCount = apostasDia.length;
    profitSum += _.sum(profit);
    profitByDay[date] = {
      profit: profitSum,
      gameCount: gameCount,
    };
  });

  return profitByDay;
}
