// One illustrative student month, shared by every section so the numbers agree
// wherever they recur (hero lanes, money check, future scenario).
export const exampleMonth = {
  income: 1020, // PayNow from Mum S$600 + part-time S$420
  protected: 687.79, // hall fees, MRT concession, phone plan, Spotify, textbooks
  toGoal: 120, // set aside for "Trip home" this month
  spent: 50, // kopi, chicken rice, Grab, Shopee, bubble tea
  daysLeft: 7,
  goalName: 'Trip home',
  goalTarget: 600,
  goalSaved: 228,
}

export const safeToday =
  Math.floor(
    ((exampleMonth.income - exampleMonth.protected - exampleMonth.toGoal - exampleMonth.spent) /
      exampleMonth.daysLeft) *
      100,
  ) / 100 // S$23.17

export const leftThisMonth = exampleMonth.income - exampleMonth.protected - exampleMonth.toGoal - exampleMonth.spent // S$162.21

export function formatSgd(value: number, options: { sign?: boolean; decimals?: number } = {}) {
  const decimals = options.decimals ?? 2
  const abs = Math.abs(value).toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const sign = value < 0 ? '-' : options.sign && value > 0 ? '+' : ''
  return `${sign}S$${abs}`
}
