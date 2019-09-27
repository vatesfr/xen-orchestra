import Xo from 'xo-lib'

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))

export const xoCall = (method: string, params: object) =>
  signedIn.then(() => xo.call(method, params))

export const getObject = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

export const allColors = [
  '#4a2e8a',
  '#7dc1df',
  '#493BD8',
  '#66ccff',
  '#006666',
  '#ADD83B',
  '#66ccff',
  '#3BC1D8',
  '#aabd8a',
  '#667772',
  '#FA8072',
  '#800080',
  '#00FF00',
  '#8abda7',
  '#cee866',
  '#6f9393',
  '#bb97cd',
  '#8778db',
  '#2f760b',
  '#a9578a',
  '#C0C0C0',
  '#000080',
  '#000000',
  '#800000',
]
