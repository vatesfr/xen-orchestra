import execa from 'execa'

export async function getXoaCheck() {
  let stdout
  try {
    stdout = await execa.stdout('xoa', ['check'])
  } catch (err) {
    return err
  }
  return stdout
}
