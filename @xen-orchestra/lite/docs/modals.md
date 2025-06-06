# Modal System Documentation

## Opening a modal

To open a modal, call `useModal(loader, props?)`.

- `loader`: The modal component loader (e.g. `() => import("path/to/MyModal.vue")`)
- `props`: The optional props to pass to the modal component

This will return an object with the following methods:

- `onApprove(cb)`:
  - A function to register a callback to be called when the modal is approved.
  - The callback will receive the modal payload as first argument, if any.
  - The callback can return a Promise, in which case the modal will wait for it to resolve before closing.
- `onDecline(cb)`:
  - A function to register a callback to be called when the modal is declined.
  - The callback can return a Promise, in which case the modal will wait for it to resolve before closing.

### Static modal

```ts
useModal(MyModal)
```

### Modal with props

```ts
useModal(MyModal, { message: 'Hello world!' })
```

### Handle modal approval

```ts
const { onApprove } = useModal(MyModal, { message: 'Hello world!' })

onApprove(() => console.log('Modal approved'))
```

### Handle modal approval with payload

```ts
const { onApprove } = useModal(MyModal, { message: 'Hello world!' })

onApprove(payload => console.log('Modal approved with payload', payload))
```

### Handle modal decline

```ts
const { onDecline } = useModal(MyModal, { message: 'Hello world!' })

onDecline(() => console.log('Modal declined'))
```

### Handle modal close

```ts
const { onClose } = useModal(MyModal, { message: 'Hello world!' })

onClose(() => console.log('Modal closed'))
```

## Modal controller

Inside the modal component, you can inject the modal controller with `inject(IK_MODAL)!`.

```ts
const modal = inject(IK_MODAL)!
```

You can then use the following properties and methods on the `modal` object:

- `isBusy`: Whether the modal is currently doing something (e.g. waiting for a promise to resolve).
- `approve(payload?: any | Promise<any>)`: Approve the modal with an optional payload.
  - Set `isBusy` to `true`.
  - Wait for the `payload` to resolve (if any).
  - Wait for all callbacks registered with `onApprove` to resolve (if any).
  - Close the modal in case of success.
- `decline()`: Decline the modal.
  - Set `isBusy` to `true`.
  - Wait for all callbacks registered with `onDecline` to resolve (if any).
  - Close the modal in case of success.

## Components

Some components are available for quick modal creation.

### `UiModal`

The root component of the modal which will display the backdrop.

A click on the backdrop will execute `modal.decline()`.

It accepts `color` and `disabled` props which will update the `ColorContext` and `DisabledContext`.

`DisabledContext` will also be set to `true` when `modal.isBusy` is `true`.

The component itself is a `form` and is meant to be used with `<UiModal @submit.prevent="modal.approve()">`.

### `ModalApproveButton`

A wrapper around `UiButton` with `type="submit"` and with the `busy` prop set to `modal.isBusy`.

### `ModalDeclineButton`

A wrapper around `UiButton` with an `outline` prop and with the `busy` prop set to `modal.isBusy`.

This button will call `modal.decline()` on click.

Default text is `t("cancel")`.
