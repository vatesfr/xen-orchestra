import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import renderXoItem from 'render-xo-item'
import Tooltip from 'tooltip'
import { createSelector } from 'selectors'
import { isPciHidden } from 'xo'
import { Select } from 'form'
import { SelectHost } from 'select-objects'

export default class PciAttachModal extends Component {
  state = {
    hiddenPcis: undefined,
    host: this.props.vm.$container !== this.props.vm.$pool ? this.props.vm.$container : undefined,
    pcis: [],
  }

  get value() {
    return this.state.pcis
  }

  async componentDidMount() {
    this.setState({ hiddenPcis: await this.getHiddenPcis() })
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.host !== this.state.host) {
      this.setState({
        pcis: [],
        hiddenPcis: await this.getHiddenPcis(),
      })
    }
  }

  async getHiddenPcis() {
    const host = this.state.host
    if (host === undefined) {
      return undefined
    }
    const hidden = []
    await Promise.all(
      this.props.pcisByHost[host].map(async pci => {
        if (await isPciHidden(pci.id)) {
          hidden.push(pci)
        }
      })
    )
    return hidden
  }

  onChangeHost = host => this.linkState('host')(host?.id)

  _getHostPredicate = host => this.props.vm.$pool === host.$pool

  _getPcis = createSelector(
    () => this.state.hiddenPcis,
    () => this.props.attachedPciIds,
    (pcis, attachedPciIds) =>
      pcis?.filter(pci => !attachedPciIds?.includes(pci.pci_id)).map(pci => ({ value: pci.id, ...pci })) // value property is needed for multi select
  )

  render() {
    const { pool } = this.props
    const isHostSelected = this.state.host !== undefined
    return (
      <div>
        {/* For ACL users without authorization on the pool, there is no point in displaying an empty selector */}
        {pool !== undefined && (
          <SelectHost onChange={this.onChangeHost} predicate={this._getHostPredicate} value={this.state.host} />
        )}
        <Tooltip content={isHostSelected ? undefined : _('selectHostFirst')}>
          <Select
            className='mt-1'
            disabled={!isHostSelected}
            multi
            onChange={this.linkState('pcis')}
            optionRenderer={renderXoItem}
            options={this._getPcis()}
            placeholder={_('selectPcis')}
            value={this.state.pcis}
          />
        </Tooltip>
      </div>
    )
  }
}
