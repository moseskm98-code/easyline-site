export const LEAD_ENDPOINT = "https://api.easyline.club/inquiries";
export const PERSONAL_DATA_VERSION = "12 мая 2026";

const PHONE_PATTERN = /^\+\d{10,15}$/;

export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return "";
}

export function buildInquiryPayload({ idempotencyKey, name, phone }) {
  const fullName = String(name || "").trim();
  const normalizedPhone = normalizePhone(phone);
  if (fullName.length < 2 || fullName.length > 80 || !PHONE_PATTERN.test(normalizedPhone)) {
    const error = new TypeError("Проверьте имя и телефон");
    error.code = "validation_error";
    throw error;
  }

  return {
    idempotencyKey,
    fullName,
    phone: normalizedPhone,
    message: "Заявка на протокол питания на 28 дней",
    consent: true,
    personalDataVersion: PERSONAL_DATA_VERSION,
    website: "",
  };
}

export async function submitInquiry(input, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildInquiryPayload(input)),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    const error = new Error(body?.error?.message || "Не удалось отправить заявку");
    error.code = body?.error?.code || "request_failed";
    throw error;
  }
  return body.data;
}
