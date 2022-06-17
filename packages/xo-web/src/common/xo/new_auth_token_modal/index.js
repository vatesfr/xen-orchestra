import BaseComponent from 'base-component'
import React from 'react'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'

export default class NewAuthTokenModal extends BaseComponent {
  get value() {
    return this.state
  }

  render() {
    const { description, expiration } = this.state

    return (
      <div>
        <div className='pb-1'>
          <SingleLineRow>
            <Col size={4}>{_('expiration')}</Col>
            <Col size={8}>
              <input
                className='form-control'
                min={new Date().toISOString().split('T')[0]}
                onChange={this.linkState('expiration')}
                type='date'
                value={expiration ?? ''}
              />
            </Col>
          </SingleLineRow>
        </div>
        <div className='pb-1'>
          <SingleLineRow>
            <Col size={4}>{_('description')}</Col>
            <Col size={8}>
              <textarea
                className='form-control'
                onChange={this.linkState('description')}
                rows={10}
                value={description ?? ''}
              />
            </Col>
          </SingleLineRow>
        </div>
      </div>
    )
  }
}
