import Component from 'base-component'
import React from 'react'
import { areObjectsFetched } from 'selectors'
import { connectStore } from 'utils'
import { noop } from 'lodash'

@connectStore({
  areObjectsFetched,
})
export default class Hash extends Component {
  static contextTypes = {
    router: React.PropTypes.object,
  }

  componentDidUpdate () {
    if (
      this._wrapper &&
      this._wrapper.scrollIntoView &&
      this.context.router.location.hash === `#${this.props.hash}` &&
      this.props.areObjectsFetched
    ) {
      setTimeout(() => this._wrapper.scrollIntoView(), 1000)
      this.componentDidUpdate = noop
    }
  }

  render () {
    return (
      <span
        ref={ref => {
          this._wrapper = ref
        }}
      >
        {this.props.children}
      </span>
    )
  }
}
