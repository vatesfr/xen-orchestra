Error.stackTraceLimit = 100

// Removes internal modules.
try {
  const sep = require('path').sep

  require('stack-chain').filter.attach(function (_, frames) {
    const filtered = frames.filter(function (frame) {
      const name = frame && frame.getFileName()

      return (
        // has a filename
        name &&

        // contains a separator (no internal modules)
        name.indexOf(sep) !== -1 &&

        // does not start with `internal`
        name.lastIndexOf('internal', 0) !== -1
      )
    })

    // depd (used amongst other by express requires at least 3 frames
    // in the stack.
    return filtered.length > 2
      ? filtered
      : frames
  })
} catch (_) {}

// Source maps.
try { require('julien-f-source-map-support/register') } catch (_) {}
