import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Select } from 'form'
import { SelectHost } from 'select-objects'
import { createSelector } from 'selectors'
import { isPciHidden } from 'xo'
import Tooltip from 'tooltip'

const PCI_RENDERER = pci => `${pci.class_name} ${pci.device_name} (${pci.pci_id})`

export default class PciAttachModal extends Component {
  state = {
    host: this.props.host,
    hiddenPcis: undefined,
    pcis: [],
  }

  get value() {
    return this.state.pcis
  }

  async componentDidMount() {
    const { props } = this
    if (props.host !== undefined) {
      const hiddenPcis = await this.getHiddenPcis(props.pcisByHost[props.host])
      this.setState({ hiddenPcis })
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    const { props, state } = this
    if (prevState.host !== state.host) {
      if (this.state.host === undefined) {
        this.setState({ hiddenPcis: undefined, pcis: [] })
      } else {
        const hiddenPcis = await this.getHiddenPcis(props.pcisByHost[state.host])
        this.setState({ hiddenPcis })
      }
    }
  }

  onChangeHost = host => this.linkState('host')(host?.id)

  async getHiddenPcis(pcis) {
    const hidden = []
    await Promise.all(
      pcis.map(async pci => {
        if (await isPciHidden(pci.id)) {
          hidden.push(pci)
        }
      })
    )
    return hidden
  }

  _getHostPredicate = createSelector(
    () => this.props.pool,
    poolId => host => host.$pool === poolId
  )

  _getPciPredicate = createSelector(
    () => this.props.attachedPciIds,
    pciIds => pci => {
      console.log('predicate trigged')
      console.log(pciIds)
      console.log(pci.pci_id)
      return !pciIds.include(pci.pci_id)
    }
  )

  _getPcis = createSelector(
    () => this.state.hiddenPcis,
    () => this.props.attachedPciIds,
    (pcis, attachedPciIds) =>
      pcis?.filter(pci => !attachedPciIds.includes(pci.pci_id)).map(pci => ({ value: pci.id, ...pci })) // value property is needed for multi select
  )

  render() {
    return (
      <div>
        <SelectHost value={this.state.host} predicate={this._getHostPredicate()} onChange={this.onChangeHost} />
        <Tooltip content={this.state.host === undefined ? 'Select an host first' : undefined}>
          <Select
            className='mt-1'
            disabled={this.state.host === undefined}
            options={this._getPcis()}
            optionRenderer={PCI_RENDERER}
            placeholder={'Select PCI(s)'}
            onChange={this.linkState('pcis')}
            value={this.state.pcis}
            multi
          />
        </Tooltip>
      </div>
    )
  }
}
