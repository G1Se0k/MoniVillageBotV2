# MoniVillage Bot V2

Discord 커뮤니티용 봇과 함께 동작하는 Next.js 컴패니언 웹 스토어. 서버 멤버가 활동으로 얻은 코인으로 웹 상점에서 닉네임 심볼·MBTI 이용권 등을 구매하고 인벤토리에서 장착하면, 봇이 실시간으로 Discord 닉네임에 반영한다.

**Live**: <https://mirattic.com>

---

## Stack

| Layer | Tech |
|-------|------|
| Bot | TypeScript, discord.js v14 |
| Web | TypeScript, Next.js 16 (App Router, React Server Components), Tailwind CSS v4, TossPayments SDK |
| Shared | Sequelize (MySQL), 공용 상수·모델 |
| Infra | Docker Compose, Caddy (자동 TLS), Cloudflare (Full mode) |
| Auth | Discord OAuth2, HMAC-SHA256 세션 쿠키 |

## Monorepo 구조

```
packages/
├─ bot/     Discord 봇 (커맨드, 인터랙션, 코인 보상 루프)
├─ shared/  Sequelize 모델·쿼리, 상수 (bot·web 양쪽에서 임포트)
└─ web/     Next.js App Router (OAuth, 상점, 인벤토리, 지갑)
```

npm workspaces + TypeScript project references. `@moni/shared`를 bot·web이 공유해 DB 스키마와 도메인 로직이 한 곳에 존재한다.

---

## 핵심 구현

### 1. Discord OAuth + HMAC 서명 세션 쿠키

외부 세션 스토어 없이 상태 없는 인증. Payload를 base64url 인코딩하고 서버 시크릿으로 HMAC-SHA256 서명, `timingSafeEqual`로 검증한다.

`packages/web/src/lib/session.ts`

```ts
const sign = (body: string) =>
  b64url(createHmac('sha256', getSecret()).update(body).digest());

const decode = (token: string): SessionPayload | null => {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
  if (payload.exp * 1000 < Date.now()) return null;
  return payload;
};
```

**결정**: JWT 라이브러리 추가 없이 Node.js stdlib(`node:crypto`)만으로 처리. 서명 검증에 `timingSafeEqual`을 써서 타이밍 공격 방어.

OAuth state 파라미터도 별도 짧은 수명(5분) 쿠키로 발급 후 콜백에서 `consumeOauthState`로 소비 — CSRF 방어.

### 2. 원자적 코인 적립 (upsert + 증가 한 방)

통화방 활성 유저마다 매 분마다 실행되는 hot path. `findOrCreate` → `increment` 2-3 라운드트립을 MySQL `ON DUPLICATE KEY UPDATE`로 단일 쿼리화.

`packages/shared/src/database/queries.ts`

```ts
export async function creditCoin(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  await sequelize.query(
    'INSERT INTO user_wallets (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?',
    { replacements: [userId, amount, amount] },
  );
}
```

**결정**: Sequelize `upsert`는 balance를 고정값으로 대체하므로 부적합. 원자 증가와 upsert를 동시에 달성하는 유일한 방법이 raw SQL. Prepared statement 사용으로 injection 차단.

### 3. 통화방 접속 시간 → 코인 (in-memory 상태 + tick)

`voiceStateUpdate`로 참여 시작 시각을 기록, 1분 tick으로 완료된 5분 청크마다 코인 지급. 봇 재시작 시 `ready` 이벤트에서 현재 접속 유저들의 시작 시각을 seed.

`packages/bot/src/interactions/coinRewards.ts`

```ts
client.on('voiceStateUpdate', (oldState, newState) => {
  const wasIn = !!oldState.channelId;
  const nowIn = !!newState.channelId;
  if (!wasIn && nowIn) voiceStart.set(newState.id, Date.now());
  else if (wasIn && !nowIn) voiceStart.delete(newState.id);
});

client.once('ready', () => {
  for (const guild of client.guilds.cache.values()) {
    guild.voiceStates.cache.forEach((state) => {
      if (state.channelId && !state.member?.user.bot) {
        voiceStart.set(state.id, Date.now());
      }
    });
  }
});

setInterval(async () => {
  const now = Date.now();
  for (const [uid, start] of voiceStart.entries()) {
    const chunks = Math.floor((now - start) / VOICE_CHUNK_MS);
    if (chunks < 1) continue;
    await creditCoin(uid, chunks);
    voiceStart.set(uid, start + chunks * VOICE_CHUNK_MS);
  }
}, VOICE_TICK_MS);
```

**트레이드오프**: in-memory Map은 봇 프로세스 재시작 시 카운터가 리셋된다. 친목 서버 규모(수십명)를 감안해 영속화 대신 단순성 선택. 재시작 후 seed 로직으로 현재 접속자는 즉시 복구되어, 재시작 손실 = 진행 중 청크만.

### 4. Server Component + Client Component 경계 설계

TossPayments SDK는 브라우저 실행이 필수인 반면 클라이언트 키는 서버 런타임 env에서 관리해야 함. 서버 컴포넌트가 env를 읽어 prop으로 클라이언트 컴포넌트에 넘긴다. `NEXT_PUBLIC_` 접두사 불필요 → 빌드 타임 번들 인라인 대신 런타임 env로 통합.

`packages/web/src/app/wallet/topup/[coins]/page.tsx` (server)
```ts
const clientKey = process.env.TOSS_CLIENT_KEY;
if (!clientKey) return <ErrorPage />;
return <TopupButton clientKey={clientKey} coins={coins} amount={price} customerKey={user.id} />;
```

`TopupButton.tsx` (`'use client'`)
```tsx
export function TopupButton({ clientKey, coins, amount, customerKey }: Props) {
  async function onPay() {
    const tossPayments = window.TossPayments(clientKey);
    const payment = tossPayments.payment({ customerKey });
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId: `topup-${coins}-${randHex(8)}`,
      orderName: `코인 ${coins}개`,
      successUrl: `${window.location.origin}/wallet/topup/success`,
      failUrl: `${window.location.origin}/wallet/topup/fail`,
    });
  }
  return <button onClick={onPay}>결제하기</button>;
}
```

**결정**: 결제 검증(금액·주문 ID 형식·중복 처리)은 서버 라우트(`/wallet/topup/success`)에서. 클라이언트는 SDK만 담당.

### 5. 결제 성공 시 서버측 검증 및 원자 적립

Toss가 성공 URL로 리다이렉트하면 서버 라우트가 주문 ID 파싱 → 금액 대조 → `sequelize.transaction`으로 결제 승인 요청과 지갑 증가를 원자적으로 처리.

`packages/web/src/app/wallet/topup/success/route.ts` (핵심 로직)
```ts
const m = /^topup-(\d+)-/.exec(orderId);
if (!m) return NextResponse.redirect(new URL('/wallet?err=bad_order', origin));

const expected = packagePrice(Number(m[1]));
if (expected !== Number(amount)) {
  return NextResponse.redirect(new URL('/wallet?err=amount_mismatch', origin));
}

const approved = await approveTossPayment({ paymentKey, orderId, amount: expected });
if (!approved.ok) return NextResponse.redirect(new URL(`/wallet?err=${approved.code}`, origin));

await creditCoin(userId, Number(m[1]));
return NextResponse.redirect(new URL('/wallet?ok=1', origin));
```

### 6. 아이템 구매 트랜잭션 (동시성 대응)

지갑 잔액 검증과 인벤토리 삽입을 SELECT ... FOR UPDATE 락으로 보호. 중복 구매 시 코인 차감 없이 성공 처리(멱등성).

`packages/web/src/lib/purchase.ts`

```ts
await sequelize.transaction(async (t) => {
  const [wallet] = await UserWallet.findOrCreate({
    where: { user_id: user.id },
    defaults: { user_id: user.id, balance: 0 },
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const [, created] = await UserItem.findOrCreate({
    where: { user_id: user.id, item_id: item.id },
    defaults: { user_id: user.id, item_id: item.id, equipped: false },
    transaction: t,
  });
  if (!created) return; // 이미 보유 — 코인 차감 없이 성공

  if (wallet.balance < item.price) {
    insufficient = true;
    throw new Error('rollback');
  }
  wallet.balance -= item.price;
  await wallet.save({ transaction: t });
});
```

### 7. 닉네임 심볼 반영 (부스터 폴백 처리)

웹 인벤토리에서 심볼을 장착·해제하면 서버 액션이 Discord API를 호출해 닉네임 양옆 이모지를 교체. 심볼 해제 시 폴백 이모지는 서버 부스터 여부에 따라 분기(`🟪` vs MBTI 그룹 이모지).

`packages/web/src/lib/discordNickname.ts`
```ts
const memberPromise = symbol
  ? null
  : Member.findOne({ where: { user_id: userId, guild_id: guildId } });
const info = await fetchMember(userId, guildId, token); // Discord API

let effective = symbol;
if (!effective) {
  if (info.booster) {
    effective = '🟪';
  } else {
    const member = await memberPromise; // 병렬 시작한 프로미스 회수
    effective = member ? GROUP_EMOJIS[mbtiPrefix(member.mbti_type)] : GROUP_EMOJIS.NO;
  }
}

const [first, last] = [currentNick.indexOf(' '), currentNick.lastIndexOf(' ')];
if (first === -1 || last === first) return;
const middle = currentNick.slice(first + 1, last);
await patchNick(userId, guildId, token, `${effective} ${middle} ${effective}`);
```

**병렬화**: DB Member 조회를 Discord API 호출과 동시 시작. 부스터일 땐 결과 안 씀(약간 낭비), 아닐 땐 대기 시간 절약.

### 8. Next.js 프로덕션 minify 방어 (Sequelize alias 충돌)

Next.js 프로덕션 빌드는 클래스명을 minify → Sequelize가 클래스명을 SQL alias로 쓰는데, `Item`과 `UserItem`이 모두 `f`로 축약되어 `Not unique table/alias: 'f'` 런타임 에러 발생.

**해결**: 모든 Sequelize 모델의 `init()` 옵션에 `modelName: 'XxxName'` 명시.

`packages/shared/src/database/models/Item.ts`
```ts
Item.init(
  { /* attributes */ },
  {
    sequelize,
    modelName: 'Item',     // ← minify 이후에도 안정적인 SQL alias
    tableName: 'items',
    freezeTableName: true,
  },
);
```

디버깅 과정에서 SQL 로그의 `FROM user_items AS f INNER JOIN items AS f`로 원인 특정.

### 9. Reverse proxy 뒤 절대 URL 해결

Caddy·Cloudflare 뒤에서 `req.nextUrl.origin`이 백엔드 `http://host:3000`을 반환. OAuth 콜백·Toss redirect URL이 깨짐. `X-Forwarded-Proto`를 Next.js가 자동 반영하지 않음.

`packages/web/src/lib/appUrl.ts`
```ts
export function getAppOrigin(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}
```

배포에선 `APP_URL=https://mirattic.com`을 env로 명시. 4개 라우트(OAuth callback/logout, Toss success/fail)에서 `req.url`·`req.nextUrl.origin` 대신 이 헬퍼 사용.

### 10. 도커 멀티스테이지 빌드 + Caddy 자동 TLS

`Dockerfile.web` — 빌더 스테이지에서 workspace 전체 설치·빌드, 런타임 스테이지는 `--omit=dev`로 슬림화. `.next` + `public` + `next.config.ts`만 복사.

`docker-compose.yml`은 bot/web/caddy 3개 서비스. Caddy `tls internal`(자동 self-signed) + Cloudflare Full 모드로 오리진 인증서 관리 없이 HTTPS.

`Caddyfile`
```
mirattic.com {
    tls internal
    encode zstd gzip
    reverse_proxy web:3000
}
```

**결정**: Cloudflare Full Strict는 유효한 오리진 인증서 필요 → 관리 비용 증가. Full 모드로 self-signed 허용하되 Cloudflare↔브라우저 구간은 정상 인증서. 엔드투엔드 암호화 유지.

---

## 로컬 실행

```bash
npm install
cp packages/web/.env.local.example packages/web/.env.local
# .env, packages/web/.env.local 값 채우기 (DB, Discord OAuth, Toss test key)

npm -w @moni/shared run build
npm -w @moni/bot run dev      # 봇
npm -w @moni/web  run dev     # 웹 (localhost:3000)
```

## Docker 배포

```bash
docker compose build
docker compose up -d
# bot / web (3000) / caddy (80, 443) 3개 컨테이너 기동
```

---

## Notable engineering trade-offs

- **모노레포 vs 개별 저장소**: 봇·웹이 스키마·상수를 공유하므로 workspace로 묶어 타입 안정성 확보. 배포 단위는 여전히 분리(각각 Docker 서비스).
- **Sequelize vs Prisma**: 기존 프로젝트 마이그레이션이라 유지. Prisma로 갔다면 `modelName` 이슈 자체가 없었을 것. 단, raw SQL 이스케이프(`creditCoin`의 upsert)가 필요한 유연성 확보.
- **테스트 결제 유지**: Toss Payments live 키 승격은 사업자 심사 필요. 프로젝트 목적상 테스트 결제로 결제 플로우 완결성 시연.
- **In-memory 코인 카운터**: Redis 없이 운영. 재시작 손실을 감수하되, 재시작 시 seed로 통화방 상태 복구.
- **친목 서버 규모**: N+1 쿼리를 원천 방지하기보단, 실측 성능이 문제되면 최적화하는 방향. 최근 감사로 `getEquippedSymbol` 2→1 쿼리, `equipItem` 병렬화 등 hot path만 정리.

---

## AI 협업

이 프로젝트는 **Claude Code**(Anthropic)를 페어 프로그래밍 파트너로 활용해 개발했다. AI가 담당한 영역과 사람이 담당한 영역을 명확히 분리해 협업했다.

**AI 활용 지점**
- 반복 코드 생성 (Sequelize 모델 boilerplate, Next.js 라우트 스캐폴딩)
- 디버깅 파트너 (Sequelize alias 충돌의 원인이 Next.js minify라는 것을 SQL 로그와 함께 추론, reverse proxy origin 이슈 원인 특정)
- 리팩터링 및 코드 감사 (N+1 쿼리, 병렬화 기회, dead guard 식별)
- 배포 인프라 구성 초안 (Dockerfile 멀티스테이지, Caddyfile, docker-compose)
- 커밋 메시지·PR 설명·이 README 초안 작성

**사람이 담당한 영역**
- 요구사항 정의 및 우선순위 (어떤 기능을 만들지, 무엇을 뒤로 미룰지)
- 아키텍처·트레이드오프 결정 (모노레포 vs 분리, Sequelize 유지, 결제 검증 위치)
- 모든 AI 산출물 리뷰·수정 및 실제 커밋·배포
- 보안 경계(테스트 결제 유지, 시크릿 관리 방식) 결정
- 프로덕션 이슈 재현 및 검증

AI를 "코드를 대신 써주는 도구"가 아니라 "설계 결정을 함께 검토하는 상급 개발자"로 사용하는 방식에 집중했다. 모든 결정은 사람이 내리고 결과물을 검증한 뒤 커밋했다.

---

## 라이선스

Private. 포트폴리오 열람 목적.
