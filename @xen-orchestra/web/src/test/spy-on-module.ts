type Procedure = (...args: any[]) => any

// Kept on `globalThis`: without test isolation, the factories of `global-module-mocks.ts` run again for each test
// file, and so may this module, while the modules loaded by previous files keep the spies they were given
const registry = ((globalThis as { __moduleSpies?: unknown }).__moduleSpies ??= {
  spies: new Set<ReturnType<typeof vi.fn>>(),
  originals: new WeakMap<object, Procedure>(),
  spiedModules: new WeakMap<object, unknown>(),
}) as {
  spies: Set<ReturnType<typeof vi.fn>>
  originals: WeakMap<object, Procedure>
  spiedModules: WeakMap<object, unknown>
}

function isClass(value: Procedure) {
  return Function.prototype.toString.call(value).startsWith('class')
}

function spyOn(fn: Procedure) {
  const spy = vi.fn(fn)
  registry.spies.add(spy)
  registry.originals.set(spy, fn)

  return spy
}

function mapFunctionExports(module: unknown, map: (fn: Procedure) => unknown) {
  return Object.fromEntries(
    Object.entries(module as Record<string, unknown>).map(([name, value]) => [
      name,
      typeof value === 'function' ? map(value as Procedure) : value,
    ])
  )
}

/**
 * `vi.mock` factory of `global-module-mocks.ts`: every function export of the real module becomes a spy calling
 * it. The module then exists once for every test file, whichever loads it first — what running the test files
 * without isolation needs. Classes stay as they are, so `instanceof` keeps working.
 */
export async function spyOnOriginal<TModule>(importOriginal: () => Promise<TModule>): Promise<TModule> {
  const module = (await importOriginal()) as object

  if (!registry.spiedModules.has(module)) {
    registry.spiedModules.set(
      module,
      mapFunctionExports(module, fn => (isClass(fn) ? fn : spyOn(fn)))
    )
  }

  return registry.spiedModules.get(module) as TModule
}

// What `importOriginal` gives a `vi.mock` factory: the module with its real functions, not their spies
async function importUnspied<TModule>(module: Promise<TModule>): Promise<TModule> {
  return mapFunctionExports(await module, fn => registry.originals.get(fn) ?? fn) as TModule
}

/**
 * Puts every spy of `spyOnOriginal` back on the real implementation, with no recorded call: run before each test.
 */
export function resetModuleSpies() {
  for (const spy of registry.spies) {
    spy.mockReset()
  }
}

/**
 * The spy `global-module-mocks.ts` put on an export, to stub the whole export: what a test tells it to do applies to that
 * test only, and it calls the real export again before the next one. Typed as a plain `vi.fn()`, so a test can make it
 * return only what the code under test reads.
 */
export function mockedExport(exportedFn: unknown) {
  if (!vi.isMockFunction(exportedFn)) {
    throw new Error('mockedExport: expected a function export of a module of global-module-mocks.ts')
  }

  return exportedFn as unknown as ReturnType<typeof vi.fn<Procedure>>
}

/**
 * Replaces exports of a module mocked in `global-module-mocks.ts`, in every test of the file: called with the same
 * arguments as `vi.mock`, at the top level of the test file. Before each test, each spy of an export the factory
 * returns calls the factory's function instead; an export it does not return stays the real one. The factory runs
 * once per file, like a `vi.mock` factory, and a name the module does not export (a mock's own state) is skipped.
 */
export function mockModule<TModule>(
  module: Promise<TModule>,
  factory: (importOriginal: () => Promise<TModule>) => Partial<TModule> | Promise<Partial<TModule>>
) {
  let replacements: Promise<Record<string, unknown>> | undefined

  beforeEach(async () => {
    replacements ??= Promise.resolve(factory(() => importUnspied(module))) as Promise<Record<string, unknown>>
    const spiedModule = (await module) as Record<string, unknown>
    // A mocked module throws on a name it does not export, even through `in`
    const exportNames = new Set(Object.keys(spiedModule))

    for (const [name, replacement] of Object.entries(await replacements)) {
      const spy = exportNames.has(name) ? spiedModule[name] : undefined

      if (!exportNames.has(name) || replacement === spy) {
        continue
      }

      if (!vi.isMockFunction(spy) || typeof replacement !== 'function') {
        throw new Error(`mockModule: "${name}" must be a function export of a module of global-module-mocks.ts`)
      }

      spy.mockImplementation((...args: unknown[]) => replacement(...args))
    }
  })
}
