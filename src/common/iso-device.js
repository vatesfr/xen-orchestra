import React from 'react'

import ActionButton from './action-button'
import Component from './base-component'
import { SelectVdi } from './select-objects'
import {
  createGetObjectsOfType,
  createFinder,
  createGetObject
} from './selectors'
import {
  connectStore,
  propTypes
} from './utils'
import {
  ejectCd,
  insertCd
} from './xo'

const isoContainerPredicate = sr => sr.SR_type === 'iso'

@propTypes({
  vm: propTypes.object.isRequired
})
@connectStore(() => {
  const getCdDrive = createFinder(
    createGetObjectsOfType('VBD').pick(
      (_, { vm }) => vm.$VBDs
    ),
    vbd => vbd.is_cd_drive
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
  constructor (props) {
    super(props)
    this._predicate = vdi => vdi.$pool === props.vm.$pool
  }

  _handleInsert = async iso => {
    const { mountedIso, vm } = this.props

    if (mountedIso) {
      await ejectCd(vm)
    }

    insertCd(vm, iso.id)
  }

  _handleEject = () => {
    const { props } = this

    if (props.mountedIso) {
      ejectCd(props.vm).then(() => {
        this.refs.selectIso.value = undefined
      })
    }
  }

  render () {
    return (
      <div className='input-group'>
        <SelectVdi
          defaultValue={this.props.mountedIso}
          containerPredicate={isoContainerPredicate}
          onChange={this._handleInsert}
          predicate={this._predicate}
          ref='selectIso'
        />
        <span className='input-group-btn'>
          <ActionButton
            btnStyle='secondary'
            disabled={!this.props.mountedIso}
            handler={this._handleEject}
            icon='vm-eject'
          />
        </span>
      </div>
    )
  }
}
