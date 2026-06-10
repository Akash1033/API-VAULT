// Path: src/utils/botDetector.ts
// Purpose: Common bot/crawler user agent patterns to exclude from analytics
// Dependencies: none

const BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baidu/i, /yandex/i,
  /facebot/i, /ia_archiver/i, /bot/i, /crawl/i, /spider/i, /scraper/i,
  /python-requests/i, /curl/i, /wget/i, /postman/i, /insomnia/i, /httpie/i,
  /go-http-client/i, /java/i, /phantom/i, /headless/i, /lighthouse/i,
  /pagespeed/i, /gtmetrix/i, /pingdom/i, /uptimerobot/i
];

export function isBot(userAgent?: string): boolean {
  if (!userAgent) return true; // no user agent = likely a bot
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// Also filter out your own admin visits
export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/api/v1/admin');
}
