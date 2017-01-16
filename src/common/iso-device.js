import React from 'react'

import ActionButton from './action-button'
import Component from './base-component'
import propTypes from './prop-types'
import { connectStore } from './utils'
import { SelectVdi } from './select-objects'
import {
  createGetObjectsOfType,
  createFinder,
  createGetObject,
  createSelector
} from './selectors'
import {
  ejectCd,
  insertCd
} from './xo'

@propTypes({
  vm: propTypes.object.isRequired
})
@connectStore(() => {
  const getCdDrive = createFinder(
    createGetObjectsOfType('VBD').pick(
      (_, { vm }) => vm.$VBDs
    ),
    [ vbd => vbd.is_cd_drive ]
  )

  const getMountedIso = createGetObject(
    (state, props) => {
      const cdDrive = getCdDrive(state, props)
      if (cdDrive) {
        return cdDrive.VDI
      }
    }
  )

  return {
    cdDrive: getCdDrive,
    mountedIso: getMountedIso
  }
})
export default class IsoDevice extends Component {
  _getPredicate = createSelector(
    () => this.props.vm.$pool,
    () => this.props.vm.$container,
    (vmPool, vmContainer) => sr => {
      const vmRunning = vmContainer !== vmPool
      const sameHost = vmContainer === sr.$container
      const samePool = vmPool === sr.$pool

      return (
        samePool && (vmRunning ? sr.shared || sameHost : true) &&
        sr.SR_type === 'iso' || sr.SR_type === 'udev' && sr.size
      )
    }
  )

  _handleInsert = iso => {
    const { vm } = this.props

    if (iso) {
      insertCd(vm, iso.id, true)
    } else {
      ejectCd(vm)
    }
  }

  _handleEject = () => ejectCd(this.props.vm)

  render () {
    const { mountedIso } = this.props

    return (
      <div className='input-group'>
        <SelectVdi
          srPredicate={this._getPredicate()}
          onChange={this._handleInsert}
          value={mountedIso}
        />
        <span className='input-group-btn'>
          <ActionButton
            btnStyle='secondary'
            disabled={!mountedIso}
            handler={this._handleEject}
            icon='vm-eject'
          />
        </span>
      </div>
    )
  }
}
