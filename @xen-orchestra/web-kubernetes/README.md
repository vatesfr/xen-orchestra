# XO 6 Kubernetes UI plugin

Kubernetes views of Xen Orchestra 6 (clusters, nodes, treeview), built and delivered separately from XO 6.

XO 6 (`@xen-orchestra/web`) loads it at runtime as a [Module Federation](https://module-federation.io/) remote: this package builds a `remoteEntry.js` exposing `./plugin` (see `src/plugin.ts`), which provides:

- the routes (`src/pages`, file-based routing as in XO 6)
- the translations (`src/locales`, merged into XO 6 translations)
- the treeview branch, its node components and the active node resolution

## How it works

XO 6 is the host. It shares as singletons, so that the plugin uses the very same instances (Vue app, router, stores, i18n, injection keys…):

- `vue`, `vue-router`, `pinia`, `vue-i18n` and `@regle/core`
- every `@xen-orchestra/web-core` module (imported with `@core/…`, as in XO 6)
- the XO 6 SDK (`@xen-orchestra/web/ui-plugin-sdk`, see `@xen-orchestra/web/src/modules/ui-plugin/sdk.ts`): collections, components and helpers of XO 6 that plugins may use

The shared configuration of both sides lives in `@xen-orchestra/web/federation.config.ts`.

Rules for the plugin code:

- import XO 6 only through `@xen-orchestra/web/ui-plugin-sdk`: other XO 6 modules are not available at runtime (the build fails if `@/` points outside of this package)
- `@/` refers to this package
- other libraries are bundled in the plugin: only use stateless ones, or share them in `federation.config.ts`

The contract between XO 6 and its plugins is versioned with `UI_PLUGIN_API_VERSION` (`@xen-orchestra/web/src/modules/ui-plugin/types/ui-plugin.type.ts`). XO 6 refuses a plugin built for another version, and starts without a plugin that cannot be loaded.

## Development

1. Start the plugin: `yarn dev` (rebuilds on change and serves it on http://localhost:4174)
2. In `@xen-orchestra/web/.env`, declare it: `VITE_XO_UI_PLUGINS=xo_kubernetes=http://localhost:4174/remoteEntry.js`
3. Start XO 6 as usual: `yarn dev` in `@xen-orchestra/web`

There is no hot module replacement across the federation boundary: reload XO 6 after a change of the plugin.

Unit tests (`yarn test`) run without federation: XO 6 modules used by the SDK and the XO 6 test helpers (`@xen-orchestra/web/src/test/…`) are imported directly.

## Delivery

`yarn build` produces `dist/`, to be served by any HTTP server reachable by the browser.

For now, XO 6 gets the plugins to load at build time from `VITE_XO_UI_PLUGINS`. Discovering them at runtime from xo-server is the next step.
