import _ from 'intl'
import mapValues from 'lodash/mapValues'

const keymap = {
  XoApp: {
    GO_TO_HOSTS: 'g h',
    GO_TO_POOLS: 'g p',
    GO_TO_VMS: 'g v',
    CREATE_VM: 'c v',
    UNFOCUS: 'esc',
    HELP: ['h', '?']
  },
  Home: {
    SEARCH: 's',
    NAV_DOWN: 'j',
    NAV_UP: 'k',
    SELECT: 'x',
    JUMP_INTO: 'enter'
  }
}
export { keymap as default }

export const help = mapValues(keymap, (shortcuts, contextLabel) => ({
  name: _(`shortcut_${contextLabel}`),
  shortcuts: mapValues(shortcuts, (shortcut, label) => ({
    keys: shortcuts[label],
    message: _(`shortcut_${label}`)
  }))
}))
