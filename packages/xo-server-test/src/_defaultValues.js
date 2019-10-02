import config from './_config'

export const getDefaultCredentials = () => {
  const { email, password } = config.xoConnection
  return { email, password }
}

export const getDefaultName = () => `xo-server-test ${new Date().toISOString()}`

export const getDefaultSchedule = () => ({
  name: getDefaultName(),
  cron: '0 * * * * *',
})
