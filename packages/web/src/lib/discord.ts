const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const ME_URL = 'https://discord.com/api/users/@me';

const env = () => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET / DISCORD_REDIRECT_URI 미설정');
  }
  return { clientId, clientSecret, redirectUri };
};

export function buildAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = env();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'none',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

export async function exchangeCodeForUser(code: string): Promise<DiscordUser> {
  const { clientId, clientSecret, redirectUri } = env();

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const meRes = await fetch(ME_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!meRes.ok) {
    throw new Error(`user fetch failed: ${meRes.status}`);
  }
  const me = (await meRes.json()) as DiscordUser;
  return { id: me.id, username: me.username, avatar: me.avatar ?? null };
}
