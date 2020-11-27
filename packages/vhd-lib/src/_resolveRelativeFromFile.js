import { dirname, resolve } from 'path'

const resolveRelativeFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)

export { resolveRelativeFromFile as default }
