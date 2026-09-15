/**
 * 리버스 프록시(Caddy/Cloudflare) 뒤에서는 req.url / nextUrl.origin 이
 * 백엔드 http://host:3000 을 반환할 수 있어 절대 URL을 만들 때 못 씀.
 * 배포에서는 APP_URL env로 명시. 미설정 시 로컬 개발 기본값.
 */
export function getAppOrigin(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}
