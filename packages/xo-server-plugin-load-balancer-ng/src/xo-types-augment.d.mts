// Augments @vates/types sub-modules with methods that exist at runtime in xo-server
// but are not yet part of the published type definitions.
//
// TODO: upstream these additions to @vates/types

import type { IncomingMessage, ServerResponse } from 'node:http'

// Each key is either a path segment (nested spec) or an HTTP method handler prefixed with _
// (e.g. _get, _post, _put, _delete, _patch).
type RestApiHandler = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => unknown
type RestApiSpec = { [key: string]: RestApiHandler | { [key: string]: RestApiHandler | Record<string, unknown> } }

// Xapi is defined in lib/xen-orchestra-xapi, exported via ./xen-api
declare module '@vates/types/lib/xen-orchestra/xapi' {
  interface Xapi {
    /** Shut down the given host. */
    shutdownHost(hostId: string): Promise<void>
    /** Power on the given host. */
    powerOnHost(hostId: string): Promise<void>
  }
}

// XoApp is a `type` alias in @vates/types and cannot be augmented via declaration merging.
// We export a named extension used wherever registerRestApi is needed.
import type { XoApp } from '@vates/types'

export type XoAppWithRestApi = XoApp & {
  /**
   * Register REST API routes under `base`.
   * Keys prefixed with `_` are HTTP methods; other keys are path segments.
   * Returns a cleanup function that unregisters the routes.
   */
  registerRestApi(spec: RestApiSpec, base?: string): () => void
}
