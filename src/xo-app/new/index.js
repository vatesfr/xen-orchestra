import { routes } from 'utils'

import Sr from './sr'

const New = routes('vm', {
  sr: Sr,
})(({ children }) => children)

export default New
