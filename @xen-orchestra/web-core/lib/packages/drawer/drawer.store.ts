import type { RegisteredDrawer } from '@core/packages/drawer/types.ts'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useDrawerStore = defineStore('drawer', () => {
  const drawers = shallowReactive(new Map<symbol | string, RegisteredDrawer>())

  const addDrawer = (drawer: RegisteredDrawer) => {
    drawers.set(drawer.id, drawer)
  }

  const removeDrawer = (id: symbol | string) => {
    drawers.delete(id)
  }

  return {
    drawers: computed(() => Array.from(drawers.values())),
    getDrawer: (id: symbol | string) => drawers.get(id),
    addDrawer,
    removeDrawer,
  }
})
