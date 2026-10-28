import { KEYBOARD_LAYOUTS } from '@core/keyboard-layouts/keyboard-layouts.ts'
import { qwertyUsLayout } from '@core/keyboard-layouts/qwerty-us.layout.ts'
import type { KeyboardLayout, KeyboardLayoutId, KeyStroke } from '@core/types/keyboard-layout.type.ts'
import { getKeysym } from '@novnc/novnc/lib/input/util'
import { promiseTimeout } from '@vueuse/shared'

const XK_SHIFT_L = 0xffe1
const XK_ISO_LEVEL3_SHIFT = 0xfe03

// The guest drops keys sent in a burst (text cut after ~145 characters on a Fedora VM without delay)
const KEY_STROKE_DELAY_MS = 25

export type SendKey = (keysym: number, code: string, down?: boolean) => void

export function getKeyboardLayout(id: string): KeyboardLayout {
  return KEYBOARD_LAYOUTS.find(layout => layout.id === id) ?? qwertyUsLayout
}

// The guest layout cannot be detected: assume it matches the browser language
export function guessKeyboardLayoutId(language: string): KeyboardLayoutId {
  return /^fr(-fr)?$/i.test(language) ? 'fr-azerty' : 'en-us-qwerty'
}

const KEYSYM_KEYS: Record<string, string> = { '\n': 'Enter', '\t': 'Tab' }

/**
 * Key strokes sending the character itself (keysym), for VNC servers without the QEMU extended key event
 * (e.g. the host console): the guest receives the character, so its keyboard layout does not matter.
 *
 * The code is left empty so that noVNC sends the keysym, not a scancode.
 */
export function getKeysymKeyStrokes(char: string): KeyStroke[] | undefined {
  // Same conversion as the keys typed on the physical keyboard
  const keysym = getKeysym({ key: KEYSYM_KEYS[char] ?? char, code: '' })

  return keysym ? [{ code: '', keysym }] : undefined
}

/**
 * Types the text in the guest by sending, for each character, the key strokes returned by `getKeyStrokes`:
 * - with a keyboard layout's `getKeyStrokes`, only the scancode is sent (keysym 0), so the guest translates it with its
 *   own layout, which must match. This requires the QEMU extended key event, without it noVNC sends nothing.
 * - with `getKeysymKeyStrokes`, the character itself is sent, see its description.
 *
 * Typing stops as soon as `isStopped` returns true (e.g. the console was disconnected), checked before each key stroke
 * so that no modifier is left pressed.
 *
 * @returns the characters that cannot be typed, which were skipped
 */
export async function typeText(
  sendKey: SendKey,
  text: string,
  getKeyStrokes: KeyboardLayout['getKeyStrokes'],
  isStopped: () => boolean
): Promise<string[]> {
  const skippedChars = new Set<string>()

  for (const char of text.replace(/\r\n/g, '\n')) {
    const keyStrokes = getKeyStrokes(char)

    if (keyStrokes === undefined) {
      skippedChars.add(char)
      continue
    }

    for (const { code, keysym = 0, shift, altGr } of keyStrokes) {
      await promiseTimeout(KEY_STROKE_DELAY_MS)

      if (isStopped()) {
        return [...skippedChars]
      }

      if (shift) {
        sendKey(XK_SHIFT_L, 'ShiftLeft', true)
      }

      if (altGr) {
        sendKey(XK_ISO_LEVEL3_SHIFT, 'AltRight', true)
      }

      sendKey(keysym, code)

      if (altGr) {
        sendKey(XK_ISO_LEVEL3_SHIFT, 'AltRight', false)
      }

      if (shift) {
        sendKey(XK_SHIFT_L, 'ShiftLeft', false)
      }
    }
  }

  return [...skippedChars]
}
