import _ from '../../intl'
import Collapse from '../../collapse'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Sr } from '../../render-xo-item'
import { connectStore } from '../../utils'
import { createGetObjectsOfType, createSelector } from '../../selectors'

@connectStore(
  {
    srsIds: createSelector(
      createGetObjectsOfType('PBD').filter((_, { hostId, hostsIds }) => pbd =>
        hostId !== undefined ? hostId === pbd.host : hostsIds.includes(pbd.host)
      ),
      pbds => {
        const srsIds = new Set([])
        for (const id in pbds) {
          srsIds.add(pbds[id].SR)
        }
        return [...srsIds]
      }
    ),
  },
  { withRef: true }
)
export default class MultipathingModal extends Component {
  static propTypes = {
    hostId: PropTypes.string,
    hostsIds: PropTypes.arrayOf(PropTypes.string),
  }

  render() {
    const { hostId, hostsIds, srsIds } = this.props
    return (
      <div>
        {_('hostMultipathingWarning', {
          nHosts: hostId !== undefined ? 1 : hostsIds.length,
        })}
        <Collapse
          buttonText={_('hostMultipathingSrs')}
          size='small'
          className='mt-1'
        >
          {srsIds.map(srId => (
            <div key={srId}>
              <Sr id={srId} link newTab />
            </div>
          ))}
        </Collapse>
      </div>
    )
  }
}
