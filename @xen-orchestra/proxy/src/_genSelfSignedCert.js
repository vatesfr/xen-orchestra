import { execFile } from 'child_process'

const openssl = (cmd, args, { input, ...opts } = {}) =>
  new Promise((resolve, reject) => {
    const child = execFile('openssl', [cmd, ...args], opts, (error, stdout) =>
      error != null ? reject(error) : resolve(stdout)
    )
    if (input !== undefined) {
      child.stdin.end(input)
    }
  })

export async function genSelfSignedCert() {
  const key = await openssl('genrsa', ['2048'])
  return {
    cert: await openssl(
      'req',
      ['-batch', '-new', '-key', '-', '-x509', '-days', '360', '-nodes'],
      {
        input: key,
      }
    ),
    key,
  }
}
