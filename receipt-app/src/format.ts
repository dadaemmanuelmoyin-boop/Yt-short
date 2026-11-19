export const money = (n: number, currency = "USD") =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} ${currency}`;

export const symbolMoney = (n: number, currency = "USD") =>
  `${new Intl.NumberFormat("en-US", {
    style: "currency", currency, currencyDisplay: "narrowSymbol",
  }).format(n)} ${currency}`;

// "Nov 18, 2026" — UTC so the date never shifts by timezone
export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso)
  );
