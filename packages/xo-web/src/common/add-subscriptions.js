import React from 'react'
import { map, mapValues, noop } from 'lodash'

const call = fn => fn()

// `subscriptions` can be a function if we want to ensure that the subscription
// callbacks have been correctly initialized when there are circular dependencies
const addSubscriptions = subscriptions => Component =>
  class SubscriptionWrapper extends React.PureComponent {
    constructor(props) {
      super(props)

      // provide all props since the beginning (better behavior with Freactal)
      this.state = mapValues(
        (this._subscribes = typeof subscriptions === 'function' ? subscriptions(props) : subscriptions),
        noop
      )
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
