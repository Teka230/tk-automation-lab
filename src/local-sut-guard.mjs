/**
 * This suite can mutate Toolshop. Only allow local, explicit execution.
 * Neither the public reference nor buggy deployments may be targeted.
 */
export function assertLoopbackUrl(raw, label) {
  let url;
  try { url = new URL(raw); }
  catch { throw new Error(`${label} must be an absolute HTTP URL`); }
  const hosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (url.protocol !== 'http:' || !hosts.has(url.hostname) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${label} must be a root HTTP URL on localhost, 127.0.0.1 or [::1], without credentials, path, query or fragment`);
  }
  return url.origin;
}
export function isolatedSutTargets(env = process.env) {
  if (env.LOCAL_SUT_MUTATION_ACK !== 'LOCAL_ONLY') {
    throw new Error('Mutation suite disabled: set LOCAL_SUT_MUTATION_ACK=LOCAL_ONLY for a dedicated local Toolshop');
  }
  return {
    web: assertLoopbackUrl(env.LOCAL_SUT_WEB_URL ?? 'http://127.0.0.1:4200', 'LOCAL_SUT_WEB_URL'),
    api: assertLoopbackUrl(env.LOCAL_SUT_API_URL ?? 'http://127.0.0.1:8091', 'LOCAL_SUT_API_URL'),
  };
}
