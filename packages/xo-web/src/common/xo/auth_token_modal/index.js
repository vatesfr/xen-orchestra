import BaseComponent from 'base-component'
import React from 'react'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'

export default class AuthTokenModal extends BaseComponent {
  get value() {
    return this.state
  }

  componentWillMount() {
    const expiration =
      this.props.expiration !== undefined ? new Date(+this.props.expiration).toISOString().split('T')[0] : ''
    this.setState({
      description: this.props.description ?? '',
      expiration,
    })
  }

  render() {
    const { description, expiration } = this.state

    return (
      <div>
        <div className='pb-1'>
          <SingleLineRow>
            <Col size={4}>{_('authTokenExpiration')}</Col>
            <Col size={8}>
              <input
                className='form-control'
                onChange={this.linkState('expiration')}
                type='date'
                value={expiration}
                disabled={this.props.expiration !== undefined}
              />
            </Col>
          </SingleLineRow>
        </div>
        <div className='pb-1'>
          <SingleLineRow>
            <Col size={4}>{_('authTokenDescription')}</Col>
            <Col size={8}>
              <textarea
                className='form-control text-monospace'
                onChange={this.linkState('description')}
                rows={10}
                value={description}
              />
            </Col>
          </SingleLineRow>
        </div>
      </div>
    )
  }
}
