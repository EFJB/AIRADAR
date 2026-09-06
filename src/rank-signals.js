const statusWeights = {
  alert: 92,
  new: 86,
  active: 78,
  pilot: 68,
  watch: 58
};

const categoryByStatus = {
  alert: 'Regulación',
  new: 'Modelos',
  active: 'Investigación',
  pilot: 'Adopción',
  watch: 'Vigilancia'
};

export function rankSignals(signals) {
  return signals
    .map((signal) => {
      const score = statusWeights[signal.status] ?? 50;
      const confidence = score >= 80 ? 'Alta' : score >= 65 ? 'Media' : 'En seguimiento';

      return {
        ...signal,
        category: categoryByStatus[signal.status] ?? 'General',
        confidence,
        confidenceScore: Math.max(score - 6, 40),
        score
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function relativeTime(dateValue, referenceDate) {
  const milliseconds = Math.max(0, new Date(referenceDate) - new Date(dateValue));
  const days = Math.floor(milliseconds / 86_400_000);

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  return `Hace ${days} días`;
}
