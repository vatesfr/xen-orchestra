import Esxi from './esxi.mjs'
const host = '10.10.0.62'
const user = 'root'
const password = 'vateslab'
const sslVerify = false

console.log(Esxi)
const esxi = new Esxi(host, user, password, sslVerify)
console.log(esxi)
esxi.on('ready', async function () {
  //const metadata = await esxi.getTransferableVmMetadata('4')
  //console.log('metadata', metadata)

  const res = await esxi.powerOn(9)
  console.log(res)
})
