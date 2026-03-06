# Types

## How to use @vates/types?

In most cases, using types from `@vates/types` can lead to errors.
The types exported by the library represent the full typing of objects, but in XO6 we almost always use partial objects.

Therefore, you should use the `FrontXo*` types, which are built from `@vates/types` but expose only the properties retrieved by the REST API through the fields parameter.

This makes the code more type-safe and allows you to see exactly which properties are currently available on an object thanks to IDE autocompletion.
If you need a `FrontXo*` type that does not exist, simply create it at the collection level.

## Legacy

There are still places in the code where `@vates/types` types are referenced.
In most cases, these are types that point to the type ID, which is not an issue.
However, for consistency, feel free to replace `@vates/types` types with `FrontXo*` types (e.g., `XoVm['id'] → FrontXoVm['id']`) as you dev on the pages.
