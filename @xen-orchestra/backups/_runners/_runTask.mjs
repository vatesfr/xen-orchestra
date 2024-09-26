import { Task } from '../Task.mjs'

const noop = Function.prototype

export const runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs
