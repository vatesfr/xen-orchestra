# Mocking (XO 6)

The typed mock form, the partial-mock cast and shared mock modules are in [Mocking dependencies](../../../web-core/docs/tests/mocking.md); XO 6 test files use `mockModule` in place of `vi.mock`, as below. In XO 6, **mock only the remote-resource collections / stores** a composable depends on.

A test file never calls `vi.mock`. Every module a test replaces is mocked once, in `src/test/global-module-mocks.ts`, for every test file: each function it exports becomes a spy calling the real one. The module then exists once whatever file loads it first, so the test files can share their modules (no test isolation) without one file's mock leaking into another. Mocking a new module adds its line there.

A test file replaces exports with `mockModule` from `src/test/spy-on-module.ts`, at its top level, with the **typed** arguments of `vi.mock` — `mockModule(import('<module>'), factory)`. Before each test, each export the factory returns is replaced; the others stay real, and all are back to the real ones before the next test. The stub functions are plain constants, reset in `beforeEach`:

```typescript
const getHostById = vi.fn()
const isMasterHost = vi.fn()

mockModule(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById, isMasterHost })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  getHostById.mockReset()
  isMasterHost.mockReset()
})
```

A factory taking `importOriginal` receives the real exports, as with `vi.mock`.

The replacements only exist inside a test or a `beforeEach`: code run at the top level of the test file, in a `describe` body or in a `beforeAll` sees the real exports. Never call `vi.resetAllMocks()`: it would put the mocked modules back on their real exports for the rest of the test; reset the file's own stubs instead, with `resetStubs(...stubs)` (`src/test/reset-stubs.ts`) when there are several.

To stub a **whole** export, skip `mockModule`: the export already is the spy `global-module-mocks.ts` put on it. Take it with `mockedExport(useX)` (`spy-on-module.ts`, `vi.mocked` typed as a plain `vi.fn()`, so it can return a partial result): calls are recorded on it, and `mockReturnValue` & co. apply to the current test only.

```typescript
const useCreateJob = mockedExport(useXoBackupRepositoryCreateJob)

beforeEach(() => {
  useCreateJob.mockReturnValue({ run })
})
```

Unlike a fresh `vi.fn()`, it calls the **real** export until a test tells it otherwise — after the reset before each test and after its own `mockReset()` alike. Give it in `beforeEach` the default every test relies on (`mockReturnValue(undefined)` at least), or the real code runs, and may call `fetch` and hang until the test times out.

A shared mock module (see web-core) is pointed to with `mockModule`:

```typescript
mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  vmCollectionMock.reset()
})
```

`vmCollectionMock.areVmsReady` is true after a reset; set it to false to hold the collection as still loading, and `hasVmFetchError` (false after a reset) to true as failed. `vmCollectionMock.isEnabled` is the `isEnabled` option the collection was last called with. As in the real collection, its `getVmById` / `getVmsByIds` answer from `vms`, `vmsByPool` groups them by pool, `vmsByHost` groups them by the host of their `$container` (leaving out the VMs on no host), and `getVmHost` reads that host from the hosts of `mock-xo-collections.ts`.

Collections always read together share one mock module exporting each of their composables: `mock-xo-collections.ts` stands for the pool, host, SR, network, PBD, PIF and VM template collections. Each `mockModule` of these modules points to it, and `xoCollectionsMock.reset()` resets them all. Its pool collection also answers `getPoolById`, `getPoolsByIds`, `hasPoolById` and `useGetPoolById` from `pools`; its host collection `getHostById`, `useGetHostById` and `hostsByPool` from `hosts`, and `isMasterHost` / `getMasterHostByPoolId` from the `master` of `pools` (a host leads its pool only once a pool names it: `xoCollectionsMock.seedMasterHost(host)`); its SR collection `getSrById` and `getSrsByIds`, and the ISOs of `vdiIsosBySrName`; its network collection `getNetworkById`, `useGetNetworkById` and `encryptedEncapsulationsByPool` from `networks` (through the real `getEncryptedEncapsulationsByPool`), its PBD collection `pbdsBySr` and `getPbdsByIds` from `pbds`, its PIF collection `pifsByHost`, `getPifsByIds` and `getPifsByNetworkId` from `pifs`, its VM template collection `vmsTemplatesByPool` from `templates`. `arePoolsReady`, `areHostsReady`, `areSrsReady`, `areNetworksReady` and `areTemplatesReady` (true after a reset) let a test hold that collection as still loading, and `hasPoolFetchError`, `hasHostFetchError` and `hasSrFetchError` (false after a reset) as failed. `xoCollectionsMock.isEnabled.<pool|host|sr>` is the `isEnabled` option that collection was last called with. `seedV2vListPool` (`seed-v2v-list-pool.ts`) seeds the pool of a V2V list and what it offers; `xoCollectionsMock.startLoadingPools()` empties the pools and clears `arePoolsReady`.

`mock-xo-task-collection.ts` stands for the task collection: `taskCollectionMock` holds `tasks` and `areTasksReady` (true after a reset), and its collection answers `getTaskById` and `useGetTaskById` from `tasks`.

`mock-xo-task-utils.ts` stands for `useXoTaskUtils`, whose `monitorTask` waits for a task of the task collection: `taskUtilsMock.monitorTask` is the spy a job awaits (a task settling with no result after a reset), and `taskUtilsMock.reset()` goes in `beforeEach`. `answerPostsWithTask(post)` makes the mocked `fetchPost` answer each request with the task `task-of-<url>`.

The same goes for `mock-xo-v2v-vm-rows-collections.ts`, the VM, task and VM snapshot collections the V2V VM rows are built from: `v2vVmRowsCollectionsMock` holds `vms`, `tasks`, `snapshots` and their `are…Ready` flags (true after a reset; set one to false to hold that collection as still loading). Its VMs are those of `mock-xo-vm-collection.ts` and its tasks those of `mock-xo-task-collection.ts`, which it re-exports and resets.

`mock-delete-modal.ts` stands for `useDeleteModal`, whose overlay a unit test cannot answer: `deleteModalMock.answer('onConfirm' | 'onCancel')` sets how the next confirmation is answered, `deleteModalMock.confirm()` runs the `onConfirm` event of the last confirmation for a caller that passes its events instead of awaiting the answer, `deleteModalMock.open` is the spy to read the props it was opened with, and `deleteModalMock.reset()` goes in `beforeEach`.

`mock-discard-changes-modal.ts` stands for `useDiscardChangesModal`, whose overlay a unit test cannot answer: `discardChangesModalMock.answer('onConfirm' | 'onCancel')` sets how the next question is answered (`onConfirm` discards the changes, `onCancel` keeps editing), `discardChangesModalMock.open` is the spy to read whether it was asked, and `discardChangesModalMock.reset()` goes in `beforeEach`.

`mock-overlay.ts` stands for `useOverlay`, whose overlays a unit test cannot open: each call is recorded in order, as the options it was given (its `component`, its `events`) and the `open` spy it got back; `overlayMock.getOverlay<TOptions>(index = 0)` / `overlayMock.getOverlays<TOptions>()` read them back, `TOptions` typing the events for the payload they take (call it directly, without a local wrapper), `overlayMock.confirmOpened()` runs the `onConfirm` event of the first overlay opened (the events given when opening it, else those declared with it) — `confirmOpenedModal(modals)` does the same on any set of modal mocks —, and `overlayMock.reset()` goes in `beforeEach`.

`mock-v2v-vm-actions.ts` stands for `use-v2v-vm-actions.composable.ts`, whose composables open the settings drawer or delete an import VM: each `v2vVmActionsMock.useV2v*VmActions` spy returns fresh fake actions of its kind (read them back from `mock.results`), and `v2vVmActionsMock.reset()` goes in `beforeEach`.

`mock-xo-vm-device-collections.ts` stands for the VBD, VDI, VDI snapshot and VIF collections: `vmDeviceCollectionsMock` holds `vbds`, `vdis`, `vdiSnapshots`, `vifs` and the `are…Ready` flags of the VBDs, VDIs and VIFs (true after a reset), and its collections answer `getVbdsByIds`, `getVdiById`, `getVdiSnapshotById`, `useGetVdisByIds`, `getVifById`, `getVifsByIds` and `useGetVifsByIds`. `seedVmDisks(disks)` (`seed-vm-disks.ts`) seeds the VBDs and VDIs of a VM there, and returns the `$VBDs` to give that VM.

`mock-xo-schedule-collection.ts` stands for the schedule collection: `scheduleCollectionMock.schedules` holds the schedules, which its `schedulesByJobId` groups by `jobId` and its `getScheduleById` / `useGetScheduleById` answer from. `seedBackupJobWithSchedules(id, count)` (`seed-backup-job-schedules.ts`) adds a backup job's schedules there.

`mock-xo-backup-log-collection.ts` stands for the backup log collection: `backupLogCollectionMock` holds `backupLogs` and `areBackupLogsReady` (true after a reset). As in the real collection, the latest logs come first, `backupLogsByJobId` groups them by `jobId` and `getLastNBackupLogsByJobId(jobId, limit = 3)` answers from that group.

`mock-xo-proxy-collection.ts` stands for the proxy collection: `proxyCollectionMock.proxies` holds the proxies (`createProxy`), which its `getProxyById` / `useGetProxyById` answer from.

`mock-route-query.ts` stands for `useRouteQuery`: every call answers the one ref `routeQueryMock.query` (`''` after a reset), whatever the query name; a test sets it before mounting and reads it after.

`mock-backup-repository-benchmark-job.ts` stands for the backup repository benchmark job, which subscribes to server events: `benchmarkJobMock` is a `createJobStub(useXoBackupRepositoryBenchmarkJob)` (`create-job-result.ts`), so importing it is enough, without `mockModule`: `benchmarkJobMock.use` is the spy to read the repositories it was given, `benchmarkJobMock.run` the one the caller runs, `benchmarkJobMock.setState({ canRun, isRunning, errorMessage })` sets its state, and `benchmarkJobMock.reset()` goes in `beforeEach`.

`mock-backup-repository-patch.ts` holds the requests of a job changing backup repositories: `backupRepositoryPatchMock.patch` and `backupRepositoryPatchMock.checkHealth` are the spies of `fetchPatch` and `checkBackupRepositoryHealth` (`mockedExport`, so no `mockModule`), settling with no result after `backupRepositoryPatchMock.reset()`, in `beforeEach`.

`mock-xo-plugin-actions.ts` stands for `useXoPluginActions`, which runs the plugin jobs: `pluginActionsMock.useXoPluginActions` is the spy to read the plugin it was asked for, `pluginActionsMock.setActions(overrides?)` makes it return the `createPluginActions(overrides)` actions and returns them, and `pluginActionsMock.reset()` (back to the default actions) goes in `beforeEach`.

A job a single test file mocks needs no shared module: `createJobStub(useXJob)` gives its `use` spy (`mockedExport(useXJob)`, no `mockModule` needed), its `run` spy and `setState` / `reset`; `createJobStub(useBackupJobDelete, result => toJobComposableResult(result, 'deleteBackupJobs', 'isDeletingBackupJobs'))` does the same for a composable wrapping a job. Without a job, `createJobStub()` gives a fresh `use` spy, for a `mockModule` factory that picks between several stubs.

`mock-xo-routes.ts` stands for `useXoRoutes`, the XO 5 routes the app fetches: an XO 5 link reads `https://xo5.example.com/#<path>`.

`mock-xo-user.ts` stands for `useXoUserResource`: `userResourceMock.user` is the user it fetches (`undefined` after a reset).

`mock-collapse-on-overflow.ts` stands for `useCollapseOnOverflow`, which measures a layout a unit test does not have: `collapseOnOverflowMock.collapsedCount` is how many items collapse (0 after a reset), and `collapseOnOverflowMock.resetCollapsedCount` the spy of the `reset` a component calls to measure its items again.

`mock-xo-v2v-status.ts` stands for `useXoV2vStatus`, the V2V prerequisite the server reports: `v2vStatusMock` holds `canConnectV2vSource` and `v2vPrerequisite` (true and `{ state: 'ok' }` after a reset).

`mock-vm-delete.ts` stands for `useVmDelete`, which calls the REST API and opens modals: `vmDeleteMock.useVmDelete` is the spy to read the VMs a caller asked to delete, `vmDeleteMock.deleteVms` the one the caller runs, `vmDeleteMock.setDeleting(true)` holds the VMs as being deleted, `vmDeleteMock.setBlocked(message)` makes them undeletable for that reason, and `vmDeleteMock.reset()` goes in `beforeEach`.

## Network

`src/test/setup.ts` stubs the global `fetch` with a never-settling promise before each test, so composables that trigger remote requests on use never hit the network in unit tests. When a test needs a real response, `stubFetchResponse(status, body)` from `src/test/stub-fetch-response.ts` overrides it for that test only and returns the mock, to assert the request when the request is the contract (a job). `stubFetchServerError()` answers a 500 the server explains with `SERVER_ERROR_MESSAGE`; `stubV2vStartAccepted()` (the V2V start route answering `V2V_START_TASK_ID`) and `stubV2vStartProblems(errors)` (refusing the launch for those problems) live in `create-v2v-launch.ts`.
