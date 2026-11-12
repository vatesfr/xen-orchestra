# usePinnedAnchor composable

Returns a floating-ui virtual anchor pinned to the position an element had, relative to a container, when pinning started.

Useful when a floating element (dropdown, menu…) must not move while its trigger moves (e.g. a trigger placed after a list of tags that changes while the dropdown is open), but must still follow the container when the page scrolls.

## Usage

```ts
const pinnedAnchor = usePinnedAnchor({
  reference: triggerRef,
  container: () => rootRef.value?.parentElement,
  isPinned: isOpen,
})

const { floatingStyles } = useFloating(pinnedAnchor, dropdownRef, { open: isOpen })
```

## Options

| Name        | Type                                                 | Description                                                          |
| ----------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `reference` | `MaybeRefOrGetter<HTMLElement \| undefined>`         | The element whose position is captured when pinning starts           |
| `container` | `MaybeRefOrGetter<HTMLElement \| null \| undefined>` | The element the anchor follows, it must not move with `reference`    |
| `isPinned`  | `MaybeRefOrGetter<boolean>`                          | The position is captured when it becomes `true`, released on `false` |

The returned anchor is `undefined` while not pinned.
