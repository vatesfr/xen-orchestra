import { nextTick } from 'vue'

export function readLocalStorageJson(key: string) {
  return JSON.parse(localStorage.getItem(key) ?? 'null')
}

// The browser raises `storage` only in the tabs that did not write: the test raises it itself
export async function writeLocalStorageFromAnotherTab(key: string, newValue: string) {
  localStorage.setItem(key, newValue)
  window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }))
  await nextTick()
}
