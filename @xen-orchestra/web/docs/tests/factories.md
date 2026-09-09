# Test data factories

Domain objects are created through factories in `src/test/`, one per object type:

| Factory            | Builds              |
| ------------------ | ------------------- |
| `createVm`         | `FrontXoVm`         |
| `createHost`       | `FrontXoHost`       |
| `createServer`     | `FrontXoServer`     |
| `createPool`       | `FrontXoPool`       |
| `createSr`         | `FrontXoSr`         |
| `createVbd`        | `FrontXoVbd`        |
| `createVdi`        | `FrontXoVdi`        |
| `createVmSnapshot` | `FrontXoVmSnapshot` |
| `createHostStats`  | `XapiHostStats`     |
| `createVmStats`    | `XapiVmStats`       |
| `createPoolStats`  | `XapiPoolStats`     |

`createPoolStats` composes `createHostStats`, since pool stats are one entry per host: pass a `Partial<XapiHostStats>` per host id, or an `{ error }` entry for a host whose stats the pool could not fetch.

```typescript
const poolStats = createPoolStats({
  'host-1': { stats: { cpus: { '0': [10, 20] } } },
  'host-2': { error: { code: 'boom' } },
})
```

Shared _helper_ factories live there too — `mount-composable.ts`, `mount-chart-card.ts`, `create-enhanced-data-helpers.ts`, `global-test-config.ts`, `create-test-router.ts`, `find-labelled-values.ts`, `i18n.ts` and `linear-chart-stub.ts`.

Each factory returns a **fully-populated** object of the real front-end type and accepts a `Partial<T>` of overrides, spread last, so a test only states the fields relevant to its case:

```typescript
const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
const host = createHost({ memory: { size: 8 * 1024 ** 3, usage: 3 * 1024 ** 3 } })
```

Rules:

- **Reuse factories, never duplicate** the object shape inline.
- Type fixtures from the real source types so they drift with production. For a shape local to one test, derive it — e.g. `type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]` — and write a small local `createStorageUsage` helper.
- Cast branded ids with the honest type (`'host-1' as XoHost['id']`), never `as never`.
