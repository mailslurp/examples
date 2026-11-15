export function verificationLink(links, project, callback) {
  const endpoint = new URL('/auth/v1/verify', project);
  const matches = new Set();
  for (const href of links) {
    let url;
    try { url = new URL(href); } catch { continue; }
    if (url.origin === endpoint.origin && url.pathname === endpoint.pathname &&
        !url.username && !url.password && url.searchParams.get('token') &&
        ['signup', 'magiclink'].includes(url.searchParams.get('type')) &&
        url.searchParams.get('redirect_to') === callback) matches.add(url.href);
  }
  if (matches.size !== 1) throw new Error('Expected one Supabase verification link for this project and callback.');
  return [...matches][0];
}
