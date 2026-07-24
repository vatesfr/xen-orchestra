import { vi } from 'vitest'

// Composables that rely on remote resources (e.g. `useXoRoutes`) call `fetch`
// as soon as they are used. In unit tests we never want to hit the network, so
// `fetch` is stubbed with a never-settling promise: the request simply stays
// pending for the lifetime of the test. Tests that need a real response can
// override this stub locally with `vi.stubGlobal('fetch', …)`.
vi.stubGlobal(
  'fetch',
  vi.fn(() => new Promise(() => {}))
)
