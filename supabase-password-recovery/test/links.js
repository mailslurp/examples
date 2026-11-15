// The signup and recovery templates both link to /verify. Require the intended action.
export function verificationLink(links, project, callback, action) {
  if (!['signup','recovery'].includes(action)) throw new Error('Unknown email action.');
  const endpoint = new URL('/auth/v1/verify', project);
  const matches = new Set();
  for (const href of links) {
    let url;
    try { url = new URL(href); } catch { continue; }
    if (url.origin === endpoint.origin && url.pathname === endpoint.pathname &&
        !url.username && !url.password && url.searchParams.get('token') &&
        url.searchParams.get('type') === action && url.searchParams.get('redirect_to') === callback) {
      matches.add(url.href);
    }
  }
  if (matches.size !== 1) throw new Error('Expected one verification link for this project, action and callback.');
  return [...matches][0];
}
