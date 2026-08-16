// Detección básica de bots por User-Agent (Edge-friendly).
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /crawl/i,
  /indexer/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
];

export function detectBot(ua: string | null | undefined): boolean {
  if (!ua) return false;
  if (BOT_PATTERNS.some((r) => r.test(ua))) return true;
  return false;
}
