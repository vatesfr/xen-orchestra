export function listVms({ host, password, sslVerify = true, user }) {
  return this.connectToEsxiAndList({ host, user, password, sslVerify })
}

listVms.params = {
  host: { type: 'string' },
  user: { type: 'string' },
  password: { type: 'string' },
  sslVerify: { type: 'boolean', optional: true },
}

listVms.permission = 'admin'

export function checkInstall() {
  return this.checkVddkDependencies()
}

checkInstall.params = {}

checkInstall.permission = 'admin'
