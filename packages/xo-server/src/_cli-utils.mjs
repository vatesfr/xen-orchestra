import { Worker } from 'worker_threads'

export function startSpinner() {
  if (!process.stdout.isTTY) return () => {}

  const worker = new Worker(
    `const { parentPort } = require('worker_threads')
    const { writeSync } = require('fs')
    const frames = [' | ', ' / ', ' - ', ' \\\\ ']
    let i = 0
    writeSync(1, frames[0])
    const id = setInterval(() => writeSync(1, '\\r' + frames[i++ % frames.length]), 100)
    parentPort.once('message', () => { clearInterval(id); writeSync(1, '\\r\\x1b[K') })`,
    { eval: true }
  )
  worker.on('error', () => {})

  return () => worker.postMessage('stop')
}
