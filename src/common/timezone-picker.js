import ActionButton from 'action-button'
import map from 'lodash/map'
import moment from 'moment-timezone'
import React from 'react'

import _ from './intl'
import Component from './base-component'
import propTypes from './prop-types'
import { getXoServerTimezone } from './xo'
import { Select } from './form'

const SERVER_TIMEZONE = 'server'

@propTypes({
  defaultValue: propTypes.string,
  onChange: propTypes.func.isRequired,
  required: propTypes.bool,
  value: propTypes.string
})
export default class TimezonePicker extends Component {
  constructor (props) {
    super(props)

    this._localTimezone = moment.tz.guess()
    this._serverTimezone = SERVER_TIMEZONE
  }

  componentDidMount () {
    getXoServerTimezone.then(serverTimezone => {
      this.setState({
        timezone: this.props.value || this.props.defaultValue || this._serverTimezone,
        options: [
          ...map(moment.tz.names(), value => ({ label: value, value })),
          {
            label: _('serverTimezoneOption', {
              value: serverTimezone
            }),
            value: this._serverTimezone
          }
        ]
      })
    })
  }

  componentWillReceiveProps (props) {
    if (props.value !== this.props.value) {
      this.setState({ timezone: props.value || this._serverTimezone })
    }
  }

  get value () {
    return this.state.timezone === this._serverTimezone ? null : this.state.timezone
  }

  set value (value) {
    this.setState({ timezone: value || this._serverTimezone })
  }

  _onChange = option => {
    if (option && option.value === this.state.timezone) {
      return
    }

    this.setState({
      timezone: option && option.value || this._serverTimezone
    }, () =>
      this.props.onChange(this.state.timezone === this._serverTimezone ? null : this.state.timezone)
    )
  }

  _useLocalTime = () => {
    this._onChange({ value: this._localTimezone })
  }

  render () {
    const { timezone, options } = this.state

    return (
      <div>
        <Select
          className='mb-1'
          onChange={this._onChange}
          options={options}
          placeholder={_('selectTimezone')}
          required={this.props.required}
          value={timezone}
        />
        <div className='pull-right'>
          <ActionButton
            btnStyle='secondary'
            handler={this._useLocalTime}
            icon='time'
          >
            {_('timezonePickerUseLocalTime')}
          </ActionButton>
        </div>
      </div>
    )
  }
}
