# Test data factories

Domain objects are created through factories in `src/test/`, one per object type:

| Factory                                                                                            | Builds                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `createVm`                                                                                         | `FrontXoVm`                                                                                                            |
| `createHost`                                                                                       | `FrontXoHost`                                                                                                          |
| `createServer`                                                                                     | `FrontXoServer`                                                                                                        |
| `createPool`                                                                                       | `FrontXoPool` (also `DISKOR_POOL_NAME`, a name apart from its default, and `UNKNOWN_POOL_ID`, an id no pool has)       |
| `createSr`                                                                                         | `FrontXoSr`                                                                                                            |
| `createVbd`                                                                                        | `FrontXoVbd`                                                                                                           |
| `createNetwork`                                                                                    | `FrontXoNetwork`                                                                                                       |
| `createPif`, `createManagementPif`                                                                 | `FrontXoPif`, the management PIF of a pool master                                                                      |
| `createVmTemplate`                                                                                 | `FrontXoVmTemplate`                                                                                                    |
| `createVdi`                                                                                        | `FrontXoVdi`                                                                                                           |
| `createVmSnapshot`                                                                                 | `FrontXoVmSnapshot`                                                                                                    |
| `createTask` / `createV2vImportTask`                                                               | `FrontXoTask`, still pending / a V2V import task of the given `sourceVmIds` (any value, to build malformed ones)       |
| `createHostStats`                                                                                  | `XapiHostStats`                                                                                                        |
| `createVmStats`                                                                                    | `XapiVmStats`                                                                                                          |
| `createPoolStats`                                                                                  | `XapiPoolStats`                                                                                                        |
| `createV2vConnection` / `createV2vRememberedConnection`                                            | `XoV2vConnection` / `V2vRememberedConnection`                                                                          |
| `createV2vInventory`, `createV2vVm`, `createV2vVmWithDisks`, `createV2vDatastore`, `createV2vDisk` | `XoV2vInventory` and its VM (optionally from partial disks) / datastore / disk                                         |
| `createV2vNic`                                                                                     | `XoV2vNic`                                                                                                             |
| `createV2vImportVm`                                                                                | `FrontXoVm` imported by V2V (its markers, `isImporting` for a start locked without source snapshot, then VM overrides) |
| `createV2vPartialImportSnapshot`                                                                   | the `FrontXoVmSnapshot` a partial import leaves on the `createV2vImportVm` VM                                          |
| `createV2vMigrationList`, `createV2vDestinationDefaults`, `createV2vMigrationListVms`              | `V2vMigrationList`, its defaults and `count` VMs                                                                       |
| `createV2vVmRow`, `createV2vVmRowsInput`                                                           | `V2vVmRow` of an inventory VM of its own id, built by `buildV2vVmRows`, then overrides / the empty `V2vVmRowsInput`    |
| `createTableSelectionBindings`                                                                     | `SelectionBindings` of a table with nothing selected, for a table component given its selection as props               |
| `createV2vSelectedVm`, `createV2vListLock`                                                         | `V2vSelectedVm` (literal labels) / `V2vListLock` (locked), the props of the selected VMs panel components              |

`createPoolStats` composes `createHostStats`, since pool stats are one entry per host: pass a `Partial<XapiHostStats>` per host id, or an `{ error }` entry for a host whose stats the pool could not fetch.

```typescript
const poolStats = createPoolStats({
  'host-1': { stats: { cpus: { '0': [10, 20] } } },
  'host-2': { error: { code: 'boom' } },
})
```

Shared _helper_ factories live there too — `mount-composable.ts`, `mount-chart-card.ts`, `create-enhanced-data-helpers.ts`, `global-test-config.ts`, `create-test-router.ts`, `find-labelled-values.ts`, `find-parts.ts`, `find-input-labels.ts`, `find-input-messages.ts`, `find-button.ts` (`findButtonByLabel` / `getButtonByLabel` by text, `getButtonIconByLabel` by `aria-label`), `find-tags.ts` (`findTags` / `findInfos`: each `UiTag` / `UiInfo` as `{ label, accent }`), `find-card-title.ts` (`findCardTitle`, the whole title; `findCardTitleLabel`, its label alone), `create-select-bindings.ts`, `find-select-stub-labels.ts`, `mount-with-select.ts`, `select-options.ts`, `form-messages.ts`, `credentials-error-wiring.ts`, `stub-fetch-response.ts`, `silence-console-error.ts`, `create-v2v-wizard-router.ts` (and `V2V_VMS_FILTER_QUERY_KEY`, the route key of the VMs step filter), `connect-v2v-source.ts` (`connectV2vSource`: sets the V2V connection and inventory a wizard step reads, once Pinia is active), `mount-on-v2v-wizard.ts` (`mountOnV2vWizard`: stores a migration list, routes the wizard to a step, on the pool of the list unless given a query, mounts with that router, then connects a source), `mount-v2v-vms-step.ts` (`mountV2vVmsStep`: mounts a composable on the VMs step, with a stored list and a connected source), `create-v2v-vm-row.ts` (also `getV2vVmNames` / `getV2vVmIds`, the names / ids of V2V VMs or rows, in order), `v2v-vms-fixtures.ts` (two datastores and one inventory VM per case the VMs step tells apart: on one datastore, on both, unsupported, in the list), `v2v-wizard-fixtures.ts` (the connected source, a list stored for a pool without VMs then with some, and that pool), `find-table-cells.ts` (see [Testing components](./testing-components.md#tables)), `query-builder-filters.ts` (`UNPARSABLE_FILTER`), `local-storage.ts`, `v2v-remembered-connections-storage.ts`, `v2v-migration-list-storage.ts`, `fill-v2v-connection-form.ts`, `now.ts` (the fixed date of the fake timers), `screen-size.ts` (`resizeToSmallScreen`: narrows the happy-dom viewport the UI store breakpoints read, given back after the test), `i18n.ts` and `linear-chart-stub.ts`. The shared module mocks (`mock-xo-*.ts`, `mock-delete-modal.ts`) live there as well, see [mocking.md](./mocking.md).

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
