Error.stackTraceLimit = 100

// Async stacks.
//
// Disabled for now as it cause a huge memory usage with
// fs.createReadStream().
// TODO: find a way to reenable.
//
// try { require('trace') } catch (_) {}

// Removes internal modules.
try {
  var sep = require('path').sep

  require('stack-chain').filter.attach(function (_, frames) {
    var filtered = frames.filter(function (frame) {
      var name = frame && frame.getFileName()

      return (
        // has a filename
        name &&

        // contains a separator (no internal modules)
        name.indexOf(sep) !== -1
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
