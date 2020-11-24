import logError from 'log-error'
import React from 'react'

// Avoid global breakage if a component fails to render.
//
// Inspired by https://gist.github.com/Aldredcz/4d63b0a9049b00f54439f8780be7f0d8
React.createElement = (createElement => {
  const errorComponent = (
    <p
      className='text-danger'
      style={{
        fontWeight: 'bold',
      }}
    >
      an error has occurred
    </p>
  )

  const wrapRender = render => {
    function patchedRender() {
      try {
        return render.apply(this, arguments)
      } catch (error) {
        logError(error)

        return errorComponent
      }
    }
    patchedRender.originalRender = render
    return patchedRender
  }

  return function (Component) {
    if (typeof Component === 'function') {
      const patched = Component._patched
      if (patched) {
        arguments[0] = patched
      } else {
        const { prototype } = Component
        let render
        if (prototype && typeof (render = prototype.render) === 'function') {
          prototype.render = wrapRender(render)
          Component._patched = Component // itself
        } else {
          arguments[0] = Component._patched = Object.assign(wrapRender(Component), Component)
        }
      }
    }

    return createElement.apply(this, arguments)
  }
})(React.createElement)
