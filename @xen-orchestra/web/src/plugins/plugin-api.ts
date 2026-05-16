import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'

export interface PluginApi {
  router: Router
  pinia: Pinia
}

export interface XoPlugin {
  install(api: PluginApi): void | Promise<void>
}
