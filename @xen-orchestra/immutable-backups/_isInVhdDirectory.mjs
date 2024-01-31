import { dirname } from 'node:path'

// check if we are handling file directly under a vhd directory ( bat, headr, footer,..)
export default path => dirname(path).endsWith('.vhd')
