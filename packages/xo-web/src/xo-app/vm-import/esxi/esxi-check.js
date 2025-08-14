import _ from 'intl'
import { esxiCheckInstall } from 'xo'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import { LibImport } from './lib-import'

export class EsxiCheck extends Component {
  state = {
    result: {},
  }
  componentWillMount() {
    esxiCheckInstall().then(result => {
      this.setState({
        result,
      })
    })
  }
  render() {
    const { result } = this.state
    if (result === undefined) {
      return (
        <ul>
          <li>{_('esxiCheckingPrerequisite')}</li>
        </ul>
      )
    }
    return (
      <div>
        <h4>{_('esxiCheckedPrerequisite')}</h4>
        <ul className='list-group'>
          {Object.entries(result).map(([name, value]) => {
            const { status, error, version, expectedVersion } = value
            return (
              <li key={name}>
                <Icon icon={status} />
                {name} :{status === 'success' && ' ok'}
                {status === 'error' && error}
                {version && status === 'alarm' && _('esxiCheckedPrerequisiteVersion', { version, expectedVersion })}
              </li>
            )
          })}
        </ul>
        {result.vddk?.status === 'error' && <LibImport />}
      </div>
    )
  }
}
