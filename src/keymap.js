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
  }
}
export { keymap as default }

const labelToMessage = {
  XoApp: _('shortcutGlobal'),
  GO_TO_HOSTS: _('shortcutHosts'),
  GO_TO_POOLS: _('shortcutPools'),
  GO_TO_VMS: _('shortcutVms'),
  CREATE_VM: _('shortcutCreateVm'),
  HELP: _('shortcutHelp'),
  Home: _('shortcutHome')
}

export const help = mapValues(keymap, (shortcuts, contextLabel) => ({
  name: labelToMessage[contextLabel],
  shortcuts: mapValues(shortcuts, (shortcut, label) => ({
    keys: shortcuts[label],
    message: labelToMessage[label]
  }))
}))
