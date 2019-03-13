import { pickBy } from 'lodash'

const DEFAULTS = {
  __proto__: null,

  compression: '',
  concurrency: 0,
  offlineSnapshot: false,
  timeout: 0,
}

const MODES = {
  __proto__: null,

  compression: 'full',
}

const getSettingsWithNonDefaultValue = (mode, settings) =>
  pickBy(settings, (value, key) => {
    const settingMode = MODES[key]

    return (
      (settingMode === undefined || settingMode === mode) &&
      value !== undefined &&
      value !== DEFAULTS[key]
    )
  })

export { getSettingsWithNonDefaultValue as default }
