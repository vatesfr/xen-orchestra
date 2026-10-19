# Test data factories

Domain objects are created through factories in `src/test/`, one per object type:

| Factory                                                                               | Builds                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `createVm`                                                                            | `FrontXoVm`                                                  |
| `createHost`                                                                          | `FrontXoHost`                                                |
| `createServer`                                                                        | `FrontXoServer`                                              |
| `createPool`                                                                          | `FrontXoPool`                                                |
| `createSr`                                                                            | `FrontXoSr`                                                  |
| `createVbd`                                                                           | `FrontXoVbd`                                                 |
| `createNetwork`                                                                       | `FrontXoNetwork`                                             |
| `createPif`, `createManagementPif`                                                    | `FrontXoPif`, the management PIF of a pool master            |
| `createVmTemplate`                                                                    | `FrontXoVmTemplate`                                          |
| `createVdi`                                                                           | `FrontXoVdi`                                                 |
| `createVmSnapshot`                                                                    | `FrontXoVmSnapshot`                                          |
| `createHostStats`                                                                     | `XapiHostStats`                                              |
| `createVmStats`                                                                       | `XapiVmStats`                                                |
| `createPoolStats`                                                                     | `XapiPoolStats`                                              |
| `createV2vConnection` / `createV2vRememberedConnection`                               | `XoV2vConnection` / `V2vRememberedConnection`                |
| `createV2vInventory`, `createV2vVm`, `createV2vDatastore`                             | `XoV2vInventory` and its VM / datastore                      |
| `createV2vImportVm`                                                                   | `FrontXoVm` imported by V2V (its markers, then VM overrides) |
| `createV2vMigrationList`, `createV2vDestinationDefaults`, `createV2vMigrationListVms` | `V2vMigrationList`, its defaults and `count` VMs             |

`createPoolStats` composes `createHostStats`, since pool stats are one entry per host: pass a `Partial<XapiHostStats>` per host id, or an `{ error }` entry for a host whose stats the pool could not fetch.

```typescript
const poolStats = createPoolStats({
  'host-1': { stats: { cpus: { '0': [10, 20] } } },
  'host-2': { error: { code: 'boom' } },
})
```

Shared _helper_ factories live there too — `mount-composable.ts`, `mount-chart-card.ts`, `create-enhanced-data-helpers.ts`, `global-test-config.ts`, `create-test-router.ts`, `find-labelled-values.ts`, `find-parts.ts`, `find-input-labels.ts`, `find-input-messages.ts`, `find-button.ts`, `find-card-title.ts`, `create-select-bindings.ts`, `find-select-stub-labels.ts`, `mount-with-select.ts`, `select-options.ts`, `form-messages.ts`, `credentials-error-wiring.ts`, `stub-fetch-response.ts`, `silence-console-error.ts`, `create-v2v-wizard-router.ts`, `local-storage.ts`, `v2v-remembered-connections-storage.ts`, `v2v-migration-list-storage.ts`, `fill-v2v-connection-form.ts`, `now.ts` (the fixed date of the fake timers), `i18n.ts` and `linear-chart-stub.ts`. The shared module mocks (`mock-xo-*.ts`) live there as well, see [mocking.md](./mocking.md).

Each factory returns a **fully-populated** object of the real front-end type and accepts a `Partial<T>` of overrides, spread last, so a test only states the fields relevant to its case:

```typescript
const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
const host = createHost({ memory: { size: 8 * 1024 ** 3, usage: 3 * 1024 ** 3 } })
```

Rules:

- **Reuse factories, never duplicate** the object shape inline.
- Type fixtures from the real source types so they drift with production. For a shape local to one test, derive it — e.g. `type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]` — and write a small local `createStorageUsage` helper.
- Cast branded ids with the honest type (`'host-1' as XoHost['id']`), never `as never`.

## Form messages

`form-messages.ts` builds the message a validated-form field binding carries, so a form test asserts the exact error instead of `toBeDefined()`:

```typescript
expect(form.passwordInputBindings.error).toEqual(dangerMessage(form.t('password-required')))
expect(form.usernameInputBindings.error).toEqual(invalidCredentialsMessage())
expect(form.hostInputBindings.error).toEqual(requiredMessage())
```

`credentials-error-wiring.ts` declares the `showCredentialsError` cases every form using `useCredentialsError` shares (error on the username and the password, cleared when either changes): `describeCredentialsErrorWiring(mountForm, fillRequiredFields)`.

`requiredMessage()` is the message of a `required` rule without its own `withMessage`: the app-wide `form:error:required`, installed by `createGlobalTestConfig()` like in `main.ts`.
