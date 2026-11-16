export function recoveryLink(links, callback) {
  const target = new URL(callback);
  const matches = new Set();
  for (const link of links) {
    if (!URL.canParse(link)) continue;
    const url = new URL(link);
    if (url.origin === target.origin && url.pathname === target.pathname &&
        !url.username && !url.password &&
        ['userId', 'secret'].every(key => url.searchParams.getAll(key).length === 1 && url.searchParams.get(key))) {
      matches.add(url.href);
    }
  }
  if (matches.size !== 1) throw new Error('Expected one recovery link for the configured callback.');
  return [...matches][0];
}
