import humanFormat from 'human-format'
import prettyMs from 'pretty-ms'
import progressStream from 'progress-stream'

const humanFormatOpts = {
  unit: 'B',
  scale: 'binary',
}

function printProgress(progress) {
  if (progress.length) {
    console.warn(
      '%s% of %s @ %s/s - ETA %s',
      Math.round(progress.percentage),
      humanFormat(progress.length, humanFormatOpts),
      humanFormat(progress.speed, humanFormatOpts),
      prettyMs(progress.eta * 1e3)
    )
  } else {
    console.warn(
      '%s @ %s/s',
      humanFormat(progress.transferred, humanFormatOpts),
      humanFormat(progress.speed, humanFormatOpts)
    )
  }
}

// length may come from an HTTP header (string or null)
export const streamStatsPrinter = length => {
  length = length == null ? undefined : Number(length)
  return progressStream({ length: Number.isFinite(length) ? length : undefined, time: 1e3 }, printProgress)
}
