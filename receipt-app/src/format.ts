export const money = (n: number, currency = "USD") =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} ${currency}`;

export const symbolMoney = (n: number, currency = "USD") =>
  `${new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(n)} ${currency}`;

/** "-$1,130.00" style for the activity list */
export const activityMoney = (n: number, currency = "USD") =>
  `\u2212${new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(n)}`;

const utc = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" });
export const shortDate = (iso: string) => utc({ month: "short", day: "numeric", year: "numeric" }).format(new Date(iso)); // Nov 18, 2026
export const monthDay = (iso: string) => utc({ month: "short", day: "numeric" }).format(new Date(iso)); // Nov 17

export const defaultSub = (handle: string) =>
  `We've sent the money to @${handle}.. Please note that this fee will be refunded to the recipient. You can see the details in your activity if you need them later.`;
