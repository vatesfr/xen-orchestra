import BaseComponent from 'base-component'
import React from 'react'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'
import getEventValue from '../../get-event-value'

export default class NewSshKeyModalBody extends BaseComponent {
  get value() {
    return this.state
  }

  _onKeyChange = event => {
    const key = getEventValue(event)
    const splitKey = key.split(' ')
    if (!this.state.title && splitKey.length === 3) {
      this.setState({ title: splitKey[2].split('\n')[0] })
    }
    this.setState({ key })
  }

  render() {
    const { key, title } = this.state

    return (
      <div>
        <div className='pb-1'>
          <SingleLineRow>
            <Col size={4}>{_('title')}</Col>
            <Col size={8}>
              <input className='form-control' onChange={this.linkState('title')} type='text' value={title || ''} />
            </Col>
          </SingleLineRow>
        </div>
        <div className='pb-1'>
          <SingleLineRow>
            <Col size={4}>{_('key')}</Col>
            <Col size={8}>
              <textarea
                className='form-control text-monospace'
                onChange={this._onKeyChange}
                rows={10}
                value={key || ''}
              />
            </Col>
          </SingleLineRow>
        </div>
      </div>
    )
  }
}
