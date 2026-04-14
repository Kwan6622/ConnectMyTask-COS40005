const repository = require('./repository');

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function removeHighOutliers(values) {
  if (values.length <= 4) return values;
  const med = median(values);
  const cap = Math.max(60, med * 3);
  return values.filter((v) => v > 0 && v <= cap);
}

async function getPlatformStats() {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [activeProviders7d, allProviders, groupedFirstBids, successCounts] = await Promise.all([
    repository.countActiveProvidersSince(last7Days),
    repository.countAllProviders(),
    repository.getFirstBidTimesSince(last30Days),
    repository.countSuccessRateWindow(last30Days),
  ]);

  const taskIds = groupedFirstBids.map((row) => row.taskId);
  const tasks = await repository.getTaskCreatedAtByIds(taskIds);
  const taskMap = new Map(tasks.map((task) => [task.id, task.createdAt]));

  const responseMinutesRaw = groupedFirstBids
    .map((row) => {
      const createdAt = taskMap.get(row.taskId);
      const firstBidAt = row._min.createdAt;
      if (!createdAt || !firstBidAt) return null;
      const diffMinutes = (new Date(firstBidAt).getTime() - new Date(createdAt).getTime()) / 60000;
      return diffMinutes > 0 ? diffMinutes : null;
    })
    .filter((v) => typeof v === 'number');

  const responseMinutesClean = removeHighOutliers(responseMinutesRaw);
  const avgResponseTimeMinutes = responseMinutesClean.length
    ? Math.round(responseMinutesClean.reduce((sum, v) => sum + v, 0) / responseMinutesClean.length)
    : 0;

  const successRate = successCounts.denominator > 0
    ? successCounts.numerator / successCounts.denominator
    : 0;

  return {
    activeProviders: activeProviders7d > 0 ? activeProviders7d : allProviders,
    avgResponseTimeMinutes,
    successRate,
  };
}

module.exports = {
  getPlatformStats,
};
