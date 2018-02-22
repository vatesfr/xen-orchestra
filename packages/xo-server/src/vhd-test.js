import execa from 'execa'
import vhdMerge, { chainVhd, Vhd } from './vhd-merge'
import LocalHandler from './remote-handlers/local.js'

async function testVhdMerge () {
  console.log('before merge')
  const moOfRandom = 4
  await execa('bash', [
    '-c',
    `head -c ${moOfRandom}M < /dev/urandom >randomfile`,
  ])
  await execa('bash', [
    '-c',
    `head -c ${moOfRandom / 2}M < /dev/urandom >small_randomfile`,
  ])
  await execa('qemu-img', [
    'convert',
    '-f',
    'raw',
    '-Ovpc',
    'randomfile',
    'randomfile.vhd',
  ])
  await execa('vhd-util', ['check', '-t', '-n', 'randomfile.vhd'])
  await execa('vhd-util', ['create', '-s', moOfRandom, '-n', 'empty.vhd'])
  // await execa('vhd-util', ['snapshot', '-n', 'randomfile_delta.vhd', '-p', 'randomfile.vhd'])

  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const originalSize = await handler._getSize('randomfile')
  await chainVhd(handler, 'empty.vhd', handler, 'randomfile.vhd')
  const childVhd = new Vhd(handler, 'randomfile.vhd')
  console.log('changing type')
  await childVhd.readHeaderAndFooter()
  console.log('child vhd', childVhd.footer.currentSize, originalSize)
  await childVhd.readBlockTable()
  childVhd.footer.diskType = 4 // Delta backup.
  await childVhd.writeFooter()
  console.log('chained')
  await vhdMerge(handler, 'empty.vhd', handler, 'randomfile.vhd')
  console.log('merged')
  const parentVhd = new Vhd(handler, 'empty.vhd')
  await parentVhd.readHeaderAndFooter()
  console.log('parent vhd', parentVhd.footer.currentSize)

  await execa('qemu-img', [
    'convert',
    '-f',
    'vpc',
    '-Oraw',
    'empty.vhd',
    'recovered',
  ])
  await execa('truncate', ['-s', originalSize, 'recovered'])
  console.log('ls', (await execa('ls', ['-lt'])).stdout)
  console.log(
    'diff',
    (await execa('diff', ['-q', 'randomfile', 'recovered'])).stdout
  )

  /* const vhd = new Vhd(handler, 'randomfile_delta.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockTable()
  console.log('vhd.header.maxTableEntries', vhd.header.maxTableEntries)
  await vhd.ensureBatSize(300)

  console.log('vhd.header.maxTableEntries', vhd.header.maxTableEntries)
    */
  console.log(await handler.list())
  console.log('lol')
}

export { testVhdMerge as default }
