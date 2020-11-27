import PropTypes from 'prop-types'
import React, { Component } from 'react'
import isPromise from 'promise-toolbox/isPromise'

const toString = value => (value === undefined ? 'undefined' : JSON.stringify(value, null, 2))

// This component does not handle changes in its `promise` property.
class DebugAsync extends Component {
  static propTypes = {
    promise: PropTypes.object.isRequired,
  }

  constructor(props) {
    super()

    this.state = {
      status: 'pending',
    }

    props.promise.then(
      value => this.setState({ status: 'resolved', value }),
      value => this.setState({ status: 'rejected', value })
    )
  }

  shouldComponentUpdate(_, newState) {
    return this.state.status !== newState.status
  }

  render() {
    const { status, value } = this.state

    if (status === 'pending') {
      return <pre>{'Promise { <pending> }'}</pre>
    }

    return (
      <pre>
        {'Promise { '}
        {status === 'rejected' && '<rejected> '}
        {toString(value)}
        {' }'}
      </pre>
    )
  }
}

const Debug = ({ value }) => (isPromise(value) ? <DebugAsync promise={value} /> : <pre>{toString(value)}</pre>)

Debug.propTypes = {
  value: PropTypes.any.isRequired,
}

export { Debug as default }
