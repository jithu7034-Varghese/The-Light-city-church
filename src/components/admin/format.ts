// Dates in the admin are always shown in UK time, so server and browser render the same text.
const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
const longDay = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Europe/London" });
const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatLongDate = (iso: string) => longDay.format(new Date(iso));
export const formatShortDay = (iso: string) => shortDay.format(new Date(iso));
