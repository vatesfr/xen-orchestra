import React from 'react'
import { forOwn, map } from 'lodash'

const call = fn => fn()

// `subscriptions` can be a function if we want to ensure that the subscription
// callbacks have been correctly initialized when there are circular dependencies
//
// each subscription can be either a `subscribe` function or a `[subscribe, initialValue]` array
const addSubscriptions = subscriptions => Component =>
  class SubscriptionWrapper extends React.PureComponent {
    constructor(props) {
      super(props)

      // provide all props since the beginning (better behavior with Freactal)
      const state = {}
      const subscribes = {}
      forOwn(typeof subscriptions === 'function' ? subscriptions(props) : subscriptions, (subscription, prop) => {
        if (typeof subscription === 'function') {
          subscribes[prop] = subscription
          state[prop] = undefined
        } else {
          subscribes[prop] = subscription[0]
          state[prop] = subscription[1]
        }
      })
      this.state = state
      this._subscribes = subscribes
    }

    _unsubscribes = undefined

    componentDidMount() {
      this._unsubscribes = map(this._subscribes, (subscribe, prop) =>
        subscribe(value => this.setState({ [prop]: value }))
      )
    }

    componentWillUnmount() {
      this._unsubscribes.forEach(call)
      this._unsubscribes = undefined
    }

    render() {
      return <Component {...this.props} {...this.state} />
    }
  }
export { addSubscriptions as default }
