import execa from 'execa'

export async function check() {
  return execa
    .stdout('xoa', ['check'], { env: { FORCE_COLOR: true } })
    .catch(err => err.stderr.concat(err.stdout))
}
