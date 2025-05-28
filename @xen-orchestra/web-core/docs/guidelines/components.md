## Components and Subcomponents MUST be defined as Vue SFC (Single-File Component)

## DS Components MUST be stored in the `/ui` directory of `/web-core`.

## DS Components MUST be stored in their own directory.

## Directory name MUST be in kebab-case (e.g. `my-component`)

## Component name MUST be in PascalCase

## DS Component name MUST start with `Ui` (e.g. `UiMyComponent.vue`)

❌ Bad

`components/ui/Square.vue`

✅ Good

`components/ui/square/UiSquare.vue`

## List and list item components names MUST reflect their purpose

A component that lists items MUST have a name that reflects this purpose, such as `UiTagList.vue`.

A list item component MUST have a name that reflects its purpose, such as `UiTagItem.vue`.

If a list item component is present in the DS, but not the list component, the list component MUST be implemented and stored in the `/ui` directory, and named accordingly.

List item components SHOULD be used only in the context of their list component.

❌ Bad

`components/tag-list/VtsTagList.vue` -> component that lists tags
`components/ui/tag/UiTag.vue` -> component that represents a tag item

✅ Good

`components/ui/tag-list/UiTagList.vue` -> component that lists tags
`components/ui/tag-item/UiTagItem.vue` -> component that represents a tag item

## Components SHOULD be kept short and be split into multiple subcomponents if necessary, stored in the same directory as the main component

❌ Bad

```
/components/
  /ui/
    /square/
      /UiSquare.vue
    /square-icon/
      /UiSquareIcon.vue <- This component is not part of the DS and will be used only in Square.vue
```

✅ Good

```
/components/
  /ui/
    /square/
      /UiSquare.vue
      /SquareIcon.vue
```

> [!WARNING]
> If you think that a subcomponent is likely to be reused in other components,
> ask the DS team to define it in the DS.
>
> It will be then moved in its own directory, following the DS guidelines.

## Components that are not part of the DS MUST have their name start with `Vts`, and be stored outside the `/ui` directory

This is the case for components that are not designed in the DS, but are shared between XO 6 and XO lite, such as "helpers" and "wrappers" components, for example.

❌ Bad

`components/ui/divider/Divider.vue`

✅ Good

`components/divider/VtsDivider.vue`

## DS Components MUST start with an HTML comment containing the implemented version

In the form `v1`, `v2`, etc.

> [!TIP]
> The DS team can use a minor version to indicate a change in the DS that does not affect the component style.
>
> It must not be added to the Vue component version.

❌ Bad

```vue
<!-- v1.2 -->
<template>
  <!-- code -->
</template>
```

✅ Good

```vue
<!-- v1 -->
<template>
  <!-- code -->
</template>
```

## Subcomponents MUST NOT have a version number

If a component from the DS is split into multiple subcomponents, only the main component will have a version number

## Component tags MUST follow `template`, `script` then `style` order, separated with an empty line

## Component props that are used to alter the variants MUST be required

> [!TIP]
> See also [Component variants guidelines](../component-variants.md)
> to learn how to handle different component styles based on its props or states.
