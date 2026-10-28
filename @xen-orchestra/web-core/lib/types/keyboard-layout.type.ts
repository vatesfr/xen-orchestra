// Physical key to press (KeyboardEvent.code), with the modifiers needed to produce the character
export type KeyStroke = {
  code: string
  // Character to send instead of the physical key, when the VNC server does not support scancodes
  keysym?: number
  shift?: boolean
  altGr?: boolean
}

export type KeyboardLayoutId = 'en-us-qwerty' | 'fr-azerty'

export type KeyboardLayout = {
  id: KeyboardLayoutId
  label: string
  // Returns the key strokes producing the character (several for a dead key), or undefined if the layout cannot type it
  getKeyStrokes: (char: string) => KeyStroke[] | undefined
}
