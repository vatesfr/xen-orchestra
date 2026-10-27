# Icons

XO Lite / 6 / Core projects are using Font Awesome Free icons, plus custom icons, provided through a Font Awesome Kit.

Icons are defined in `web-core/lib/icons` directory and can be displayed with the `VtsIcon` component, taking a `name` prop.

## Example

```vue
<template>
  <div>
    <VtsIcon name="object:vm" size="medium" />
  </div>
</template>
```

## Icon sources

Icon definitions are not imported from the `@fortawesome/*` packages. They are generated from the Font Awesome Kit export:

- `web-core/scripts/fa-kit/icons.json`: the `metadata/icons.json` file of the kit download (see `NOTICE.md` next to it)
- `web-core/lib/icons/kit.generated.ts`: generated from `icons.json` by `yarn generate-kit-icons`. **Never edit it by hand.**

The generated file exports one namespace per style:

| Namespace | Style                     | Prefix |
| --------- | ------------------------- | ------ |
| `solid`   | Font Awesome Free solid   | `fas`  |
| `regular` | Font Awesome Free regular | `far`  |
| `brands`  | Font Awesome Free brands  | `fab`  |
| `custom`  | Custom kit uploads        | `fak`  |

A namespace is only exported when the kit contains icons of this style. Each icon is exported under its `faXxx` name and its
aliases (e.g. `solid.faXmark` and `solid.faClose`).

```ts
import { regular, solid } from '@core/icons/kit.generated.ts'

export const myIcons = defineIconPack({
  checkbox: { icon: regular.faSquare },
  halted: { icon: solid.faSquare },
})
```

Brand icons follow the same pattern once added to the kit, e.g. `brands.faKubernetes`.

## Free styles only

Only Font Awesome **Free** styles may be committed: for each icon in `icons.json`, every style under `svg` (except `custom`)
must be listed in its `free` array. For instance, `server` is Free in `solid` but Pro in `regular`.

The generator refuses to run when a Pro style is found, and lists the offending `icon:style` pairs.

## Adding or updating icons

Only the designer adds icons (official or custom) to the kit.

1. Ask the designer to add the icon to the kit, in a Free style.
2. Replace `web-core/scripts/fa-kit/icons.json` with the `metadata/icons.json` of the new kit export.
3. Run `yarn generate-kit-icons` in `@xen-orchestra/web-core`.
4. Use the icon from the generated namespaces and commit `icons.json` with `kit.generated.ts`.

`yarn check-kit-icons` validates the licenses and that `kit.generated.ts` is up to date with `icons.json`, without writing
anything. It runs automatically in the pre-commit hook only when `icons.json` is committed, and blocks the commit if a Pro
style is found or if `kit.generated.ts` does not match `icons.json`. Changes to `kit.generated.ts` or to the generator alone
are not checked: run `yarn check-kit-icons` yourself in that case. The hook does not regenerate nor stage anything.
