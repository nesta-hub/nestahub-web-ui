/**
 * Nigerian WhatsApp numbers, as the customer types them and as we show them back.
 *
 * The server (api/src/common/utils/phone.ts) has the last word and stores
 * 2348012345678. This only decides, before we ask it, whether what was typed is worth
 * sending, and writes a saved number the way people say it (0801 234 5678).
 */

/** 08012345678, +234 801 234 5678, 801 234 5678 and 234801… all become 234801…; anything else comes back as its digits. */
function toInternationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  // "00234…" is the international dialling prefix written out.
  if (digits.startsWith("00")) digits = digits.slice(2);
  // "+2340801…": the 0 after the country code is the trunk digit and is dropped.
  if (digits.startsWith("2340") && digits.length === 14) return `234${digits.slice(4)}`;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  // Bare subscriber number (801 234 5678).
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

/** The number as a Nigerian mobile (234 then 7, 8 or 9, then 9 more digits), or null. */
function nigerianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const international = toInternationalDigits(raw);
  return /^234[789]\d{9}$/.test(international) ? international : null;
}

/** Would the server accept this as a WhatsApp number? */
export function looksLikeNigerianMobile(raw: string): boolean {
  return nigerianMobile(raw) !== null;
}

/** 2348012345678 (or any other form) as "0801 234 5678". Null when it is not a Nigerian mobile. */
export function formatNigerianLocal(raw: string | null | undefined): string | null {
  const international = nigerianMobile(raw);
  if (!international) return null;
  const local = `0${international.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
