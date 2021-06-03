import PropTypes from 'prop-types'
import React, { Component } from 'react'

import _ from '../../intl'
import Collapse from '../../collapse'
import Icon from '../../icon'
import { connectStore } from '../../utils'
import { createGetObjectsOfType, createSelector } from '../../selectors'
import { Sr } from '../../render-xo-item'

@connectStore(
  {
    srIds: createSelector(
      createGetObjectsOfType('PBD').filter(
        (_, { hostIds }) =>
          pbd =>
            hostIds.includes(pbd.host)
      ),
      pbds => {
        const srIds = new Set([])
        for (const id in pbds) {
          srIds.add(pbds[id].SR)
        }
        return [...srIds]
      }
    ),
  },
  { withRef: true }
)
export default class MultipathingModal extends Component {
  static propTypes = {
    hostIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  }

  render() {
    const { hostIds, srIds } = this.props
    return (
      <div>
        {_('hostMultipathingWarning', {
          nHosts: hostIds.length,
        })}
        <br />
        <span className='text-info'>
          <Icon icon='info' /> {_('hostMultipathingRequiredState')}
        </span>
        <Collapse buttonText={_('hostMultipathingSrs')} size='small' className='mt-1'>
          {srIds.map(srId => (
            <div key={srId}>
              <Sr id={srId} link newTab />
            </div>
          ))}
        </Collapse>
      </div>
    )
  }
}
