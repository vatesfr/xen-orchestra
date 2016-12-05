import logError from 'log-error'
import React from 'react'
import { assign, isFunction } from 'lodash'

// Avoid global breakage if a component fails to render.
//
// Inspired by https://gist.github.com/Aldredcz/4d63b0a9049b00f54439f8780be7f0d8
React.createElement = (createElement => {
  const errorComponent = <p className='text-danger' style={{
    fontWeight: 'bold'
  }}>an error has occured</p>

  const wrapRender = render => function patchedRender () {
    try {
      return render.apply(this, arguments)
    } catch (error) {
      logError(error)

      return errorComponent
    }
  }

  return function (Component) {
    if (isFunction(Component)) {
      const patched = Component._patched
      if (patched) {
        arguments[0] = patched
      } else {
        const { prototype } = Component
        let render
        if (prototype && isFunction(render = prototype.render)) {
          prototype.render = wrapRender(render)
          Component._patched = Component // itself
        } else {
          arguments[0] = Component._patched = assign(wrapRender(Component), Component)
        }
      }
    }

    return createElement.apply(this, arguments)
  }
})(React.createElement)
