const getSettingsWithNonDefaultValue = ({
  compression = '',
  mode,
  settings: { '': globalSetting = {} } = {},
}) => {
  const settings = {}
  if (globalSetting.reportWhen !== undefined) {
    settings.reportWhen = globalSetting.reportWhen
  }
  if (globalSetting.concurrency > 0) {
    settings.concurrency = globalSetting.concurrency
  }
  if (globalSetting.timeout > 0) {
    settings.timeout = globalSetting.timeout
  }
  if (globalSetting.offlineSnapshot) {
    settings.offlineSnapshot = globalSetting.offlineSnapshot
  }
  if (mode === 'full' && compression !== '') {
    settings.compression = compression
  }
  return settings
}

export { getSettingsWithNonDefaultValue as default }
