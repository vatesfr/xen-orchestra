# Overlay System

The overlay system is the single orchestration layer for **modals** (centered) and
**drawers** (side).

## Opening an overlay (`useOverlay` composable)

`useOverlay` returns a function that opens an overlay and resolves a promise once the
overlay is confirmed, canceled, or aborted.

```ts
const openDeleteModal = useOverlay(() => ({
  component: import('./MyDeleteModal.vue'),
  props: { count: items.value.length },
  onConfirm: async () => {
    await remove()
  },
}))

const response = await openDeleteModal()

if (response.status === 'confirmed') {
  // ...
}
```

### Config

- `component`: a dynamic `import()` of the overlay component to render.
- `props`: props passed to the component (each value may be a ref).
- `onConfirm` / `onCancel`: optional handlers. Their return value becomes the resolved
  payload. Return `KEEP_OVERLAY_OPEN` (or an `OverlayCancelResponse`) to keep the
  overlay open without resolving the promise.
- `keepOpenOnRouteChange`: by default an overlay is aborted on route change; set to
  `true` to keep it open.

### Responses

The promise resolves with one of three responses, discriminated by `status`:

- `OverlayConfirmResponse` (`status: 'confirmed'`): the user confirmed; `payload` is the
  value returned by `onConfirm`.
- `OverlayCancelResponse` (`status: 'canceled'`): the user declined — via the cancel
  button, or via the dismiss gesture (close button, backdrop click, <kbd>Esc</kbd>) of a
  `dismissible` modal or a drawer (drawers are always dismissible), which is an implicit
  cancel; `payload` is the value returned by `onCancel`.
- `OverlayAbortResponse` (`status: 'aborted'`): the overlay was closed externally,
  without a user decision (route change or programmatic `abort()`); `payload` is always
  `undefined` and no handler is called.

Narrowing on `status` gives the exact payload type in each branch:

```ts
if (response.status === 'confirmed') {
  response.payload // TConfirmPayload
} else if (response.status === 'canceled') {
  response.payload // TCancelPayload
} else {
  response.payload // undefined
}
```

### Errors

If `onConfirm` / `onCancel` throws, the promise rejects with the thrown error and the
overlay stays open (no longer busy), letting the user retry or cancel.

### Aborting programmatically

An abort never interrupts a busy overlay: while an `onConfirm` / `onCancel` handler is
in flight, aborting (route change or `abort()`) is ignored and the overlay settles
normally once the handler completes.

The returned promise is augmented with an `abort()` method that closes the overlay and
resolves the promise with an `OverlayAbortResponse`:

```ts
const deletePromise = openDeleteModal()

// Later, e.g. when the context is no longer relevant:
deletePromise.abort()
```

## Rendering

A single `<VtsOverlayList />` (registered once at the app root) renders every open
overlay through `OverlayProvider`, which injects the registration (`IK_OVERLAY`) so the
`VtsOverlay` shell and its buttons can reach `onConfirm` / `onCancel` / `isBusy`.

## Buttons

Inside an overlay, use `VtsOverlayConfirmButton` and `VtsOverlayCancelButton` for the
confirm/cancel actions, and `VtsOverlayButton` for any other action. By default these
buttons match the overlay's `accent` color.
