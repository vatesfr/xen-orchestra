import _ from 'messages'
import map from 'lodash/map'
import React, { Component } from 'react'
import { connectStore } from 'utils'

@connectStore([ 'objects' ])
export default class extends Component {
  render () {
    return <div>
      <h1>{_('homePage')}</h1>
      {map(this.props.objects, (object) => (
        <pre>
          {JSON.stringify(object, null, 2)}
        </pre>
      ))}
    </div>
  }
}
