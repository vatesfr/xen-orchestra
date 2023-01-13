const DIVISIONS = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
] as const;

export const toRelativeTime = (
  from: Date | number,
  to: Date | number,
  locale: string
) => {
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });

  let duration = (new Date(from).getTime() - new Date(to).getTime()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name);
    }

    duration /= division.amount;
  }

  return "";
};
