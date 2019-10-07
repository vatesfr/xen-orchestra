export const getDefaultName = () => `xo-server-test ${new Date().toISOString()}`

export const getDefaultSchedule = () => ({
  name: getDefaultName(),
  cron: '0 * * * * *',
})
