# Font Awesome kit icons

`icons.json` is the `metadata/icons.json` file of a Font Awesome Kit export. It is the source used by
`scripts/generate-kit-icons.mjs` to produce `lib/icons/kit.generated.ts`.

## Font Awesome Free icons

The `solid`, `regular` and `brands` icons in `icons.json` (and in the generated file) are
[Font Awesome Free](https://fontawesome.com) icons by Fonticons, Inc., licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See https://fontawesome.com/license/free.

Only styles listed in an icon's `free` array may be present. The generator refuses any other style, so no Font Awesome
Pro content is redistributed. The Pro `LICENSE.txt` shipped with kit downloads is intentionally not included, as it does
not apply to this content.

## Custom icons

Icons with the `custom` style (for example `host-disabled`) are custom uploads made for Vates. They are owned by
Vates SAS and distributed under the license of this package.
