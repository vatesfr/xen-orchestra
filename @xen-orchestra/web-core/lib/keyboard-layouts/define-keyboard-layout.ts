import type { KeyboardLayout, KeyboardLayoutId, KeyStroke } from '@core/types/keyboard-layout.type.ts'

export function defineKeyboardLayout(config: {
  id: KeyboardLayoutId
  label: string
  // Characters typed with a specific key sequence (symbols, accented letters, dead keys...)
  symbols: Record<string, KeyStroke[]>
  // Letters whose physical key differs from QWERTY
  letterCodes?: Record<string, string>
  // Whether digits are typed with Shift
  shiftedDigits?: boolean
}): KeyboardLayout {
  const { id, label, symbols, letterCodes = {}, shiftedDigits = false } = config

  function getKeyStrokes(char: string): KeyStroke[] | undefined {
    if (symbols[char] !== undefined) {
      return symbols[char]
    }

    if (/^[a-zA-Z]$/.test(char)) {
      const lowerChar = char.toLowerCase()

      return [{ code: letterCodes[lowerChar] ?? `Key${lowerChar.toUpperCase()}`, shift: char !== lowerChar }]
    }

    if (/^[0-9]$/.test(char)) {
      return [{ code: `Digit${char}`, shift: shiftedDigits }]
    }

    return undefined
  }

  return { id, label, getKeyStrokes }
}
