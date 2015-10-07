try { require('source-map-support/register') } catch (_) {}

// Async stacks.
try { require('trace') } catch (_) {}

// Removes node_modules and internal modules.
try {
  var sep = require('path').sep
  var path = __dirname + sep + 'node_modules' + sep

  require('stack-chain').filter.attach(function (_, frames) {
    var filtered = frames.filter(function (frame) {
      var name = frame && frame.getFileName()

      return (
        // has a filename
        name &&

        // contains a separator (no internal modules)
        // name.indexOf(sep) !== -1 &&

        // does not start with the current path followed by node_modules.
        name.lastIndexOf(path, 0) !== 0
      )
    })

    // depd (used amongst other by express requires at least 3 frames
    // in the stack.
    return filtered.length > 2
      ? filtered
      : frames
  })
} catch (_) {}
