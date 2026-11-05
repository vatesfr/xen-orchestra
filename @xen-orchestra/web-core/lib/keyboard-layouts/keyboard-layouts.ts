import type { KeyboardLayout } from '@core/types/keyboard-layout.type.ts'
import { azertyFrLayout } from './azerty-fr.layout.ts'
import { qwertyUsLayout } from './qwerty-us.layout.ts'

export const KEYBOARD_LAYOUTS: KeyboardLayout[] = [qwertyUsLayout, azertyFrLayout]
