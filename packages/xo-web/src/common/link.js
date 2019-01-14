import Link from 'react-router/lib/Link'
import PropTypes from 'prop-types'
import React from 'react'
import { routerShape } from 'react-router/lib/PropTypes'

import Component from './base-component'

// ===================================================================

export { Link as default }

// -------------------------------------------------------------------

const _IGNORED_TAGNAMES = {
  A: true,
  BUTTON: true,
  INPUT: true,
  SELECT: true,
}

export class BlockLink extends Component {
  static propTypes = {
    className: PropTypes.string,
    tagName: PropTypes.string,
  }

  static contextTypes = {
    router: routerShape,
  }

  _style = { cursor: 'pointer' }
  _onClickCapture = event => {
    const { currentTarget } = event
    let element = event.target
    while (element !== currentTarget) {
      if (_IGNORED_TAGNAMES[element.tagName]) {
        return
      }
      element = element.parentNode
    }
    event.stopPropagation()
    if (event.ctrlKey || event.button === 1) {
      window.open(this.context.router.createHref(this.props.to))
    } else {
      this.context.router.push(this.props.to)
    }
  }

  _addAuxClickListener = ref => {
    // FIXME: when https://github.com/facebook/react/issues/8529 is fixed,
    // remove and use onAuxClickCapture.
    // In Chrome ^55, middle-clicking triggers auxclick event instead of click
    // Other browsers may trigger both events.
    if (!!window.chrome && ref !== null) {
      ref.addEventListener('auxclick', this._onClickCapture)
    }
  }

  render() {
    const { children, tagName = 'div', className } = this.props
    const Component = tagName
    return (
      <Component
        className={className}
        ref={this._addAuxClickListener}
        style={this._style}
        onClickCapture={this._onClickCapture}
      >
        {children}
      </Component>
    )
  }
}
