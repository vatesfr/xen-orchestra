import map from 'lodash/map'
import React from 'react'

const call = fn => fn()

// `subscriptions` can be a function if we want to ensure that the subscription
// callbacks have been correctly initialized when there are circular dependencies
const addSubscriptions = subscriptions => Component =>
  class SubscriptionWrapper extends React.PureComponent {
    _unsubscribes = null

    componentWillMount () {
      const state = {}
      this._unsubscribes = map(
        typeof subscriptions === 'function'
          ? subscriptions(this.props)
          : subscriptions,
        (subscribe, prop) => {
          state[prop] = undefined
          return subscribe(value => this.setState({ [prop]: value }))
        }
      )

      // provide all props since the beginning (better behavior with Freactal)
      this.setState(state)
    }

    componentWillUnmount () {
      this._unsubscribes.forEach(call)
      this._unsubscribes = null
    }

    render () {
      return <Component {...this.props} {...this.state} />
    }
  }
export { addSubscriptions as default }
