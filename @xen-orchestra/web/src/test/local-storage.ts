import { silenceConsoleError } from '@/test/silence-console-error.ts'
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

// A storage that cannot be written (full, blocked) until the test ends: returns the silenced `console.error`, to assert
// the failure was logged
export function failLocalStorageWrites() {
  const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new Error('Storage is full')
  })

  onTestFinished(() => setItem.mockRestore())

  return silenceConsoleError()
}
