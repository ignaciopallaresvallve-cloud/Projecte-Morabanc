const priceFormatter = new Intl.NumberFormat("ca-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

const dateTimeFormatter = new Intl.DateTimeFormat("ca-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
