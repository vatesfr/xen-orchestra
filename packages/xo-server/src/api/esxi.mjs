export function connect({ host, password, sslVerify = true, user }) {
  return this.connectToEsxiAndList({ host, user, password, sslVerify })
}

connect.params = {
  host: { type: 'string' },
  user: { type: 'string' },
  password: { type: 'string' },
  sslVerify: { type: 'boolean', optional: true },
}
