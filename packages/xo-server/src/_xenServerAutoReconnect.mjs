import { fibonacci } from 'iterable-backoff'

// hard cap between two attempts: quick first retries, then steady 1/min
export const MAX_DELAY = 60e3

// Reconnection loop for a server in the `enabled but disconnected` state,
// which nothing else in xo-server ever retries: a failed explicit connect
// (boot, user action, host eject) or an unexpected XAPI disconnection tears
// the Xapi instance down and, without this loop, the server would stay
// disconnected until a manual reconnection.
//
// Deps are injected to keep this testable without a full app:
// - connect(id): attempt the connection, throws on failure
// - delay(ms): wait before the next attempt
// - getServer(id): server record ({ enabled }), throws if the server was deleted
// - getStatus(id): 'disconnected' | 'connecting' | 'connected'
// - isFatal(error): optional, true for permanent errors not worth retrying
// - isGone(error): optional, true when a getServer error means the server was deleted
//
// Resolves with the reason why the loop stopped, never rejects.
export async function autoReconnect(
  id,
  { connect, delay, getServer, getStatus, isFatal = () => false, isGone = () => true, log }
) {
  for (const ms of fibonacci()
    .toMs()
    .map(ms => Math.min(ms, MAX_DELAY))) {
    await delay(ms)

    let server
    try {
      server = await getServer(id)
    } catch (error) {
      if (isGone(error)) {
        return 'server deleted'
      }
      // transient failure (e.g. database hiccup): keep the loop alive
      log.debug('auto-reconnect could not read the server', { serverId: id, error })
      continue
    }
    if (!server.enabled) {
      return 'server disabled'
    }
    if (getStatus(id) !== 'disconnected') {
      return 'already connected'
    }

    try {
      await connect(id)
      return 'connected'
    } catch (error) {
      // retrying would hammer the host with invalid credentials, or never
      // succeed for permanent errors (e.g. pool already connected)
      if (error?.code === 'SESSION_AUTHENTICATION_FAILED' || isFatal(error)) {
        log.warn('auto-reconnect aborted: permanent error', { serverId: id, error })
        return 'permanent error'
      }
      log.debug('auto-reconnect attempt failed', { serverId: id, error })
    }
  }
}
