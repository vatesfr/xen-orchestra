import pickBy from 'lodash/pickBy.js'

const DEFAULTS = {
  __proto__: null,

  backupReportTpl: 'mjml',
  cbtDestroySnapshotData: false,
  checkpointSnapshot: false,
  compression: '',
  concurrency: 0,
  fullInterval: 0,
  hideSuccessfulItems: false,
  nbdConcurrency: 1,
  offlineBackup: false,
  offlineSnapshot: false,
  preferNbd: false,
  reportWhen: 'failure',
  timeout: 0,
}

const MODES = {
  __proto__: null,

  compression: 'full',
  fullInterval: 'delta',
  offlineBackup: 'full',
}

const getSettingsWithNonDefaultValue = (mode, settings) =>
  pickBy(settings, (value, key) => {
    const settingMode = MODES[key]

    return (settingMode === undefined || settingMode === mode) && value !== undefined && value !== DEFAULTS[key]
  })

export { getSettingsWithNonDefaultValue as default }
