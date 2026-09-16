import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createContext, runInContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

// Runs the *built* browser bundle inside a bare `node:vm` sandbox whose global
// object has no `process`, no `Buffer`, no `require` and no `module` — i.e.
// roughly what a browser gives you. Anything that reaches for node at runtime
// throws here instead of silently working because vitest happens to be in node.
//
// Regenerate the bundle with: vite build --config test/bundle/vite.config.mjs

// `import.meta.url` is an http: URL under happy-dom, so resolve from the
// package root (vitest's cwd) instead.
const bundle = readFileSync(resolve('test/bundle/dist/poc.iife.js'), 'utf8')

describe('the browser bundle', () => {
  it('has no node globals available in the sandbox', () => {
    const sandbox = createContext({})

    expect(runInContext('typeof process', sandbox)).toBe('undefined')
    expect(runInContext('typeof Buffer', sandbox)).toBe('undefined')
    expect(runInContext('typeof require', sandbox)).toBe('undefined')
    expect(runInContext('typeof module', sandbox)).toBe('undefined')
  })

  it('translates a VM with no node globals in scope', () => {
    const sandbox = createContext({ console })

    runInContext(bundle, sandbox)

    const vm = runInContext('globalThis.__pocResult', sandbox)

    expect(vm.type).toBe('VM')
    expect(vm.name_label).toBe('poc-vm')
    expect(vm.$container).toBe('host-uuid-0000')
    expect(vm.$pool).toBe('pool-uuid-0000')
    expect(vm.mainIpAddress).toBe('192.168.1.42')
    expect(vm.pvDriversVersion).toBe('7.30.0-123')
    expect(vm._xapiRef).toBe('OpaqueRef:vm-0000')
  })
})
