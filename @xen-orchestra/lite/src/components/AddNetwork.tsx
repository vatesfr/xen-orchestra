import React, { FormEventHandler } from 'react'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import Button from './Button'
import Input from './Input'
import IntlMessage from './IntlMessage'
import Select, { Options } from './Select'
import { alert } from './Modal'

import XapiConnection, { ObjectsByType, Pif, PifMetrics } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
  xapi: XapiConnection
}

interface State {
  formRef: React.RefObject<HTMLFormElement>
  isBonded: boolean
}

interface Props {}

interface ParentEffects {}

interface Effects {
  _newNetwork: FormEventHandler<HTMLFormElement>
  _resetForm: () => void
  _toggleBonded: () => void
}

interface Computed {
  pifs?: Map<string, Pif>
  pifsMetrics?: Map<string, PifMetrics>
}

const OPTIONS_RENDER_PIF: Options<Pif> = {
  render: (pif, additionalProps) =>
    `${pif.device} (${
      additionalProps?.pifsMetrics?.find((metrics: PifMetrics) => metrics.$ref === pif.metrics)?.device_name ??
      'unknown'
    })`,
  value: pif => pif.$id,
}
const OPTIONS_RENDER_BOND_MODE: Options<string[]> = {
  render: mode => mode,
  value: mode => mode,
}
const BOND_MODE = ['balance-slb', 'active-backup', 'lacp']

const AddNetwork = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      formRef: React.createRef(),
      isBonded: false,
    }),
    computed: {
      pifs: state => state.objectsByType.get('PIF'),
      pifsMetrics: state => state.objectsByType.get('PIF_metrics'),
    },
    effects: {
      _newNetwork: async function (e) {
        e.preventDefault()
        const { current } = this.state.formRef
        const bondMode = current?.bondMode?.value
        const desc: string = current?.desc.value || 'Created with Xen Orchestra Lite'
        const mtu = +current?.mtu.value || 1500
        const name: string | undefined = current?.networkName.value
        const pifsId: string | string[] | undefined = this.state.isBonded
          ? Array.from<HTMLOptionElement>(current?.pif.selectedOptions).map(({ value }) => value)
          : current?.pif.value
        const vlan = +current?.vlan?.value || 0

        let networkRef: string | undefined
        try {
          networkRef = (await this.state.xapi.call('network.create', {
            name_label: name,
            name_description: desc,
            other_config: { automatic: 'false' },
            MTU: mtu,
            VLAN: vlan,
          })) as string

          if (this.state.isBonded && Array.isArray(pifsId)) {
            const pifsRefList = pifsId.map(pifId => this.state.pifs?.get(pifId)?.$network.PIFs)
            await Promise.all(
              pifsRefList.map(pifs => this.state.xapi.call('Bond.create', networkRef, pifs, '', bondMode))
            )
            this.effects._toggleBonded()
          }

          if (typeof pifsId === 'string' && pifsId !== '') {
            await this.state.xapi.call(
              'pool.create_VLAN_from_PIF',
              this.state.pifs?.get(pifsId)?.$ref,
              networkRef,
              vlan
            )
          }
          this.effects._resetForm()
        } catch (error) {
          alert({ message: <p>{error.message}</p>, title: <IntlMessage id='networkCreation' /> })
          console.error(error)
          if (networkRef !== undefined) {
            await this.state.xapi.call('network.destroy', networkRef)
          }
          return
        }
      },
      _resetForm: function () {
        this.state.formRef.current?.reset()
      },
      _toggleBonded: function () {
        this.state.isBonded = !this.state.isBonded
      },
    },
  },
  ({ effects, state }) => (
    <>
      <form onSubmit={effects._newNetwork} ref={state.formRef}>
        <div>
          <label>
            <IntlMessage id='bondedNetwork' />
          </label>
          <Input checked={state.isBonded} name='bonded' onChange={effects._toggleBonded} type='checkbox' />
        </div>
        <div>
          <label>
            <IntlMessage id='interface' />
          </label>
          <Select
            additionalProps={{ pifsMetrics: state.pifsMetrics }}
            collection={state.pifs
              ?.filter(
                pif => pif.VLAN === -1 && pif.bond_slave_of === 'OpaqueRef:NULL' && pif.host === pif.$pool.master
              )
              .sortBy(pif => pif.device)
              .valueSeq()
              .toArray()}
            multiple={state.isBonded}
            name='pif'
            optionsRender={OPTIONS_RENDER_PIF}
            placeholder='selectPif'
            required={state.isBonded}
          />
        </div>
        <div>
          <label>
            <IntlMessage id='name' />
          </label>
          <Input name='networkName' required type='text' />
        </div>
        <div>
          <label>
            <IntlMessage id='description' />
          </label>
          <Input name='desc' type='text' />
        </div>
        <div>
          <label>
            <IntlMessage id='mtu' />
          </label>
          <Input name='mtu' placeholder='Default: 1500' type='number' />
        </div>
        {state.isBonded ? (
          <div>
            <label>
              <IntlMessage id='bondMode' />
            </label>
            <Select
              collection={BOND_MODE}
              name='bondMode'
              optionsRender={OPTIONS_RENDER_BOND_MODE}
              placeholder='selectBondMode'
              required
            />
          </div>
        ) : (
          <div>
            <label>
              <IntlMessage id='vlan' />
            </label>
            <Input name='vlan' placeholder='No VLAN if empty' type='number' />
          </div>
        )}
        <Button type='submit'>
          <IntlMessage id='send' />
        </Button>
      </form>
      <Button onClick={effects._resetForm}>
        <IntlMessage id='reset' />
      </Button>
    </>
  )
)

export default AddNetwork
