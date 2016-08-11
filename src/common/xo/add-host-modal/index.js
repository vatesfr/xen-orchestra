import _ from 'intl'
import BaseComponent from 'base-component'
import every from 'lodash/every'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { SelectHost } from 'select-objects'
import { Col } from 'grid'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'

@connectStore(() => ({
  hosts: createGetObjectsOfType('host')
}), { withRef: true })
export default class AddHostModal extends BaseComponent {
  get value () {
    return this.state
  }

  _hostPredicate = host =>
    host.$pool !== this.props.pool.id &&
    every(this.props.hosts, h => h.$pool !== host.$pool || h.id === host.id)

  render () {
    return <div>
      <SingleLineRow>
        <Col size={6}>{_('addHostSelectHost')}</Col>
        <Col size={6}>
          <SelectHost
            onChange={this.linkState('host')}
            predicate={this._hostPredicate}
            value={this.state.host}
          />
        </Col>
      </SingleLineRow>
    </div>
  }
}
