const ERROR_MESSAGES: Array<[string, string]> = [
  ["UNAUTHORIZED", "لطفاً دوباره وارد حساب کاربری شوید."],
  ["FORBIDDEN", "شما اجازه انجام این عملیات را ندارید."],
  ["SLUG_TAKEN", "شناسهٔ محصول تکراری است."],
  ["NOT_FOUND", "رکورد موردنظر پیدا نشد."],
  ["INVALID_PRICE", "قیمت واردشده صحیح نیست."],
  ["INVALID_COMPARE_AT", "قیمت اصلی باید از قیمت فروش بزرگ‌تر باشد."],
  ["INCOMPLETE:", "اطلاعات لازم برای این عملیات کامل نیست."],
  ["Failed to fetch", "ارتباط با سرور برقرار نشد."],
  ["Network", "ارتباط با سرور برقرار نشد."],
];

export function withAdminTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("ADMIN_TIMEOUT")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

export function getAdminErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const match = ERROR_MESSAGES.find(([needle]) => raw.includes(needle));
  if (match) return match[1];
  if (raw === "ADMIN_TIMEOUT") return "این عملیات بیشتر از حد معمول طول کشید. وضعیت را بررسی کنید و در صورت نیاز دوباره تلاش کنید.";
  if (raw.includes("فرمت فایل") || raw.includes("حجم تصویر")) return raw;
  return "عملیات انجام نشد. لطفاً دوباره تلاش کنید.";
}
