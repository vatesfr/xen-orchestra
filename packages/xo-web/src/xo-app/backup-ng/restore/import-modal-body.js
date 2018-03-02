import _ from 'intl'
import React from 'react'
import Component from 'base-component'
import { Select } from 'form'
import { SelectSr } from 'select-objects'
import { FormattedDate } from 'react-intl'

export default class ImportModalBody extends Component {
  get value () {
    return this.state
  }
  render () {
    return (
      <div>
        <div className='mb-1'>
          <Select
            optionRenderer={backup => (
              <span>
                {`[${backup.mode}] `}
                <FormattedDate
                  value={new Date(backup.timestamp)}
                  month='long'
                  day='numeric'
                  year='numeric'
                  hour='2-digit'
                  minute='2-digit'
                  second='2-digit'
                />
              </span>
            )}
            options={this.props.data.backups}
            onChange={this.linkState('backup')}
            placeholder={_('importBackupModalSelectBackup')}
          />
        </div>
        <div>
          <SelectSr onChange={this.linkState('sr')} />
        </div>
      </div>
    )
  }
}
