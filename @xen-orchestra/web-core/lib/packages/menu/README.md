# Menu System

A menu system for Vue applications supporting props binding for actions, links, router links, and nested submenus.

## Basic Usage

```vue
<template>
  <VtsMenuList>
    <VtsMenuItem v-bind="menu.save">Save</VtsMenuItem>
    <VtsMenuItem v-bind="menu.doc">Documentation</VtsMenuItem>
    <VtsMenuItem v-bind="menu.profile">Profile</VtsMenuItem>
    <li>
      <VtsMenuTrigger v-bind="menu.more.$trigger">More...</VtsMenuTrigger>
      <VtsMenuList v-bind="menu.more.$target">
        <VtsMenuItem v-bind="menu.more.settings">Settings</VtsMenuItem>
        <VtsMenuItem v-bind="menu.more.logout">Logout</VtsMenuItem>
      </VtsMenuList>
    </li>
  </VtsMenuList>
</template>

<script lang="ts" setup>
import { action, link, routerLink, toggle, useMenu } from '@core/packages/menu'

const menu = useMenu({
  save: action(() => console.log('Saving...')),
  doc: link('https://docs.example.com'),
  profile: routerLink({ name: 'profile' }),
  more: toggle({
    settings: action(() => console.log('Settings clicked')),
    logout: action(() => console.log('Logout clicked')),
  }),
})
</script>
```

> [!NOTE] > `VtsMenuItem` is a `VtsMenuTrigger` wrapped in a `<li>`

## Core Composables

### useMenu

Create a root menu with multiple items and/or submenus:

```ts
const fileMenu = useMenu({
  // Menu structure
  edit: action(() => handleEdit()),
  save: action(() => handleSave(), {
    disabled: () => !canSave.value,
    busy: isSaving,
  }),
})
```

### useMenuAction

Create an action button. It must be attached to a menu.

Mostly useful when splitting a menu into subcomponents.

```ts
const props = defineProps<{
  menu: MenuLike
}>()

const action = useMenuAction(menu, () => handleClick(), {
  disabled: isDisabled,
  busy: isLoading,
})
```

### useMenuToggle

Create a toggle menu (dropdown) with nested items.

You can pass a `parent: MenuLike` as option to attach the toggle to a parent Menu.

Skip this option to create a root menu toggle.

```ts
const dropdown = useMenuToggle(
  {
    behavior: 'click', // or 'mouseenter'
    placement: 'bottom-start',
  },
  {
    edit: action(() => handleEdit()),
    delete: action(() => handleDelete()),
  }
)
```

## Component Integration

Once you create the menu, you can bind its items as props to your template.

For now, these bindings are meant to be used with a Vue component configured with the same props

For other component or HTML Element, you can still bind the props manually.

`action()` items will generate the following props binding:

```ts
type Props = {
  as: 'button'
  type: 'button'
  disabled: boolean
  busy: boolean
  tooltip: string | false
  onMouseenter: () => void
  onClick: () => void
  'data-menu-id': string
}
```

`link()` items will generate the following props binding:

```ts
type Props = {
  as: 'a'
  href: string
  rel: 'noreferrer noopener'
  target: '_blank'
  onMouseenter: () => void
  onClick: () => void
  'data-menu-id': string
}
```

`routerLink()` items will generate the following props binding:

```ts
type Props = {
  as: RouterLink
  to: RouteLocationRaw
  onMouseenter: () => void
  onClick: () => void
  'data-menu-id': string
}
```

`toggle()` items will generate an object containing `$trigger`, `$target` and `$isOpen` (`ComputedRef<boolean>`) properties with the following props binding:

```ts
// $trigger
type Props = {
  as: 'button'
  type: 'button'
  submenu: true
  ref: (el: any) => void
  active: boolean
  onClick: () => void
  onMouseenter: () => void
  'data-menu-id': string
}

// $target
type Props = {
  ref: (el: any) => void
  style: object
  'data-menu-id': string
}
```

### Example

```vue
<template>
  <VtsMenuTrigger v-bind="menu.save">Save</VtsMenuTrigger>
  <VtsMenuTrigger v-bind="menu.docs">Documentation</VtsMenuTrigger>
  <VtsMenuTrigger v-bind="menu.profile">Profile</VtsMenuTrigger>

  <!-- Toggle/Dropdown menu -->
  <VtsMenuTrigger v-bind="menu.more.$trigger">More</VtsMenuTrigger>
  <div v-bind="menu.more.$target">
    <VtsMenuTrigger v-bind="menu.more.settings">Settings</VtsMenuTrigger>
    <VtsMenuTrigger v-bind="menu.more.logout">Logout</VtsMenuTrigger>
  </div>
</template>
```

If you want to bind props to an HTML element or a Vue component not supporting all the props,
you can use VueUse's `objectOmit` for example or bind the props completely manually.

```vue
<script>
import { objectOmit as omit } from '@vueuse/shared'
</script>

<template>
  <MyCustomElement v-bind="omit(menu.save, ['as', 'type'])">Save</MyCustomElement>
  <button v-bind="omit(menu.save, ['as', busy, 'tooltip'])" :class="{ busy: menu.save.busy }">Save</button>
</template>
```
