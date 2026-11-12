/// <reference types="vite/client" />
/// <reference types="@core/types/value-matcher" />
/// <reference types="@core/types/xen-orchestra-backups" />

// Set by xoa-packager, absence means build from source.
interface ImportMetaEnv {
  readonly VITE_XOA_BUILD?: string
  // UI plugins to load, see `src/modules/ui-plugin/ui-plugin-discovery.ts`
  readonly VITE_XO_UI_PLUGINS?: string
}
