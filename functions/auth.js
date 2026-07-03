// Cloudflare Pages Function:后台登录第 1 步——跳转到 GitHub 授权页
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
  authUrl.searchParams.set("scope", "repo,user");
  authUrl.searchParams.set("state", crypto.randomUUID());
  return Response.redirect(authUrl.toString(), 302);
}
