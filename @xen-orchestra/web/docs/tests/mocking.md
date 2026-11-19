# Mocking (XO 6)

The typed `vi.mock` form, `vi.hoisted` and shared mock modules are in [Mocking dependencies](../../../web-core/docs/tests/mocking.md). In XO 6, **mock only the remote-resource collections / stores** a composable depends on.

The shared mock modules of XO 6 live in `src/test/`. `mock-xo-vm-collection.ts` stands for `useXoVmCollection`: it answers `vmsByPool` from `vmCollectionMock.vms`, and `vmCollectionMock.areVmsReady` is true after a reset; set it to false to hold the collection as still loading.

Collections always read together share one mock module exporting each of their composables: `mock-xo-collections.ts` stands for the pool, host, SR, network, PBD, PIF and VM template collections. Each `vi.mock` of these modules points to it, and `xoCollectionsMock.reset()` resets them all. Its pool collection also answers `getPoolById`, `hasPoolById` and `useGetPoolById` from `pools`, its host collection `getHostById` and `hostsByPool` from `hosts`, its SR and network collections `getSrById` and `getNetworkById`, its network collection `useGetNetworkById` and `encryptedEncapsulationsByPool` from `networks` (through the real `getEncryptedEncapsulationsByPool`), its SR collection the ISOs of `vdiIsosBySrName`, its PBD collection `pbdsBySr` from `pbds`, its PIF collection `getPifsByIds` and `getPifsByNetworkId` from `pifs`, its VM template collection `vmsTemplatesByPool` from `templates`, and `arePoolsReady`, `areSrsReady`, `areNetworksReady` and `areTemplatesReady` (true after a reset) let a test hold that collection as still loading. `seedV2vListPool` (`seed-v2v-list-pool.ts`) seeds the pool of a V2V list and what it offers; `xoCollectionsMock.startLoadingPools()` empties the pools and clears `arePoolsReady`.

The same goes for `mock-xo-v2v-vm-rows-collections.ts`, the VM, task and VM snapshot collections the V2V VM rows are built from: `v2vVmRowsCollectionsMock` holds `vms`, `tasks`, `snapshots` and their `are…Ready` flags (true after a reset; set one to false to hold that collection as still loading). Its VMs are those of `mock-xo-vm-collection.ts`, which it re-exports and resets.

`mock-delete-modal.ts` stands for `useDeleteModal`, whose overlay a unit test cannot answer: `deleteModalMock.answer('onConfirm' | 'onCancel')` sets how the next confirmation is answered, `deleteModalMock.confirm()` runs the `onConfirm` event of the last confirmation for a caller that passes its events instead of awaiting the answer, `deleteModalMock.open` is the spy to read the props it was opened with, and `deleteModalMock.reset()` goes in `beforeEach`.

`mock-discard-changes-modal.ts` stands for `useDiscardChangesModal`, whose overlay a unit test cannot answer: `discardChangesModalMock.answer('onConfirm' | 'onCancel')` sets how the next question is answered (`onConfirm` discards the changes, `onCancel` keeps editing), `discardChangesModalMock.open` is the spy to read whether it was asked, and `discardChangesModalMock.reset()` goes in `beforeEach`.

`mock-overlay.ts` stands for `useOverlay`, whose overlays a unit test cannot open: each call is recorded in order, as the options it was given (its `component`, its `events`) and the `open` spy it got back; `overlayMock.getOverlay<TOptions>(index = 0)` / `overlayMock.getOverlays<TOptions>()` read them back, `TOptions` typing the events for the payload they take (call it directly, without a local wrapper), and `overlayMock.reset()` goes in `beforeEach`.

`mock-v2v-vm-actions.ts` stands for `use-v2v-vm-actions.composable.ts`, whose composables open the settings drawer or delete an import VM: each `v2vVmActionsMock.useV2v*VmActions` spy returns fresh fake actions of its kind (read them back from `mock.results`), and `v2vVmActionsMock.reset()` goes in `beforeEach`.

`mock-xo-vm-device-collections.ts` stands for the VBD, VDI, VDI snapshot and VIF collections: `vmDeviceCollectionsMock` holds `vbds`, `vdis`, `vdiSnapshots`, `vifs` and the `are…Ready` flags of the VBDs, VDIs and VIFs (true after a reset), and its collections answer `getVbdsByIds` and `getVifsByIds`, and `getVbdById`, `getVdiById`, `getVdiSnapshotById` and `getVifById`.

`mock-xo-routes.ts` stands for `useXoRoutes`, the XO 5 routes the app fetches: an XO 5 link reads `https://xo5.example.com/#<path>`.

`mock-xo-v2v-status.ts` stands for `useXoV2vStatus`, the V2V prerequisite the server reports: `v2vStatusMock` holds `canConnectV2vSource` and `v2vPrerequisite` (true and `{ state: 'ok' }` after a reset).

`mock-vm-delete.ts` stands for `useVmDelete`, which calls the REST API and opens modals: `vmDeleteMock.useVmDelete` is the spy to read the VMs a caller asked to delete, `vmDeleteMock.deleteVms` the one the caller runs, `vmDeleteMock.setDeleting(true)` holds the VMs as being deleted, `vmDeleteMock.setBlocked(message)` makes them undeletable for that reason, and `vmDeleteMock.reset()` goes in `beforeEach`.

## Network

`src/test/setup.ts` stubs the global `fetch` with a never-settling promise before each test, so composables that trigger remote requests on use never hit the network in unit tests. When a test needs a real response, `stubFetchResponse(status, body)` from `src/test/stub-fetch-response.ts` overrides it for that test only and returns the mock, to assert the request when the request is the contract (a job). `stubFetchServerError()` answers a 500 the server explains with `SERVER_ERROR_MESSAGE`; `stubV2vStartAccepted()` (the V2V start route answering `V2V_START_TASK_ID`) and `stubV2vStartProblems(errors)` (refusing the launch for those problems) live in `create-v2v-launch.ts`.
