// The browser-safety proof: this entry is bundled by Vite for `target: esnext`
// with no node polyfills and no `external`. If any transitive import still
// reaches `tmp`, `crypto`, `path`, `highland` or `node:assert`, the build fails.

import xapiObjectToXo from '../../index.mjs'
import { createXapiGraph } from '../../browser/index.mjs'
import { recordsByType, REFS } from '../fixtures/pool-records.mjs'

const { getObjectByRef } = createXapiGraph({ recordsByType })

globalThis.__pocResult = xapiObjectToXo(getObjectByRef(REFS.VM))
