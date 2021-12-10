import AddIcon from '@mui/icons-material/Add'
import React from 'react'
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore'
import { Map } from 'immutable'
import { SelectChangeEvent } from '@mui/material'
import { withState } from 'reaclette'

import Button from './Button'
import Checkbox from './Checkbox'
import Input from './Input'
import IntlMessage from './IntlMessage'
import Select from './Select'
import { alert } from './Modal'

import XapiConnection, { ObjectsByType, Pif, PifMetrics } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
  xapi: XapiConnection
}

interface State {
  isBonded: boolean
  isLoading: boolean
  form: {
    [key: string]: unknown
    bondMode: string
    description: string
    mtu: string
    nameLabel: string
    pifsId: string | string[]
    vlan: string
  }
}

interface Props {}

interface ParentEffects {}

interface Effects {
  createNetwork: React.FormEventHandler<HTMLFormElement>
  handleChange: (e: SelectChangeEvent<unknown> | React.ChangeEvent<{ name: string; value: unknown }>) => void
  resetForm: () => void
  toggleBonded: () => void
}

interface Computed {
  collection?: Pif[]
  pifs?: Map<string, Pif>
  pifsMetrics?: Map<string, PifMetrics>
}

const BOND_MODE = ['active-backup', 'balance-slb', 'lacp']

const BUTTON_STYLES = {
  marginRight: '1em',
  width: 'fit-content',
}

const OPTION_PIF_RENDERER = (pif: Pif, { pifsMetrics }: { pifsMetrics: Computed['pifsMetrics'] }) =>
  `${pif.device} (${pifsMetrics?.find(metrics => metrics.$ref === pif.metrics)?.device_name ?? 'unknown'})`

const INPUT_STYLES = {
  marginBottom: '1em',
  width: '100%',
}

const getInitialFormState = () => ({
  bondMode: '',
  description: '',
  mtu: '',
  nameLabel: '',
  pifsId: '',
  vlan: '',
})

const AddNetwork = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      isBonded: false,
      isLoading: false,
      form: getInitialFormState(),
    }),
    computed: {
      pifs: state => state.objectsByType.get('PIF'),
      pifsMetrics: state => state.objectsByType.get('PIF_metrics'),
      collection: state =>
        state.pifs
          ?.filter(pif => pif.VLAN === -1 && pif.bond_slave_of === 'OpaqueRef:NULL' && pif.host === pif.$pool.master)
          .sortBy(pif => pif.device)
          .valueSeq()
          .toArray(),
    },
    effects: {
      createNetwork: async function (e) {
        e.preventDefault()
        // FIXME:
        // Loading state will be handled by ActionButton in the future
        // We should remove this when ActionButton is created
        if (this.state.isLoading) {
          return
        }
        this.state.isLoading = true
        const { bondMode, description, mtu, nameLabel, pifsId, vlan } = this.state.form

        try {
          await this.state.xapi.createNetworks([
            {
              MTU: +mtu,
              name_description: description,
              name_label: nameLabel,
              VLAN: +vlan,
              bondMode: bondMode === '' ? undefined : bondMode,
              pifsId: pifsId === '' ? undefined : Array.isArray(pifsId) ? pifsId : [pifsId],
            },
          ])
          this.effects.resetForm()
        } catch (error) {
          console.error(error)
          if (error instanceof Error) {
            alert({
              icon: 'exclamation-triangle',
              message: <p>{error.message}</p>,
              title: <IntlMessage id='networkCreation' />,
            })
          }
        }
        this.state.isLoading = false
      },
      handleChange: function ({ target: { name, value } }) {
        // Reason why form values are initialized with empty string and not a undefined value
        // Warning: A component is changing an uncontrolled input to be controlled.
        // This is likely caused by the value changing from undefined to a defined value,
        // which should not happen. Decide between using a controlled or uncontrolled input
        // element for the lifetime of the component.
        // More info: https://reactjs.org/link/controlled-components
        const { form } = this.state
        if (form[name] !== undefined) {
          this.state.form = {
            ...form,
            [name]: value,
          }
        }
      },
      resetForm: function () {
        this.state.isBonded = false
        this.state.form = getInitialFormState()
      },
      toggleBonded: function () {
        this.state.isBonded = !this.state.isBonded
        // In bonded network case, we need an array to send severale pif id
        this.state.form.pifsId = this.state.isBonded ? [] : ''
      },
    },
  },
  ({
    effects: { createNetwork, handleChange, resetForm, toggleBonded },
    state: { isBonded, isLoading, pifsMetrics, collection, form },
  }) => (
    <form
      onSubmit={createNetwork}
      style={{
        width: '20em',
      }}
    >
      <label>
        <IntlMessage id='bondedNetwork' />
      </label>
      <Checkbox checked={isBonded} name='bonded' onChange={toggleBonded} />
      <div>
        <label>
          <IntlMessage id='interface' />
        </label>
        <Select
          additionalProps={{ pifsMetrics }}
          containerStyle={INPUT_STYLES}
          multiple={isBonded}
          name='pifsId'
          onChange={handleChange}
          optionRenderer={OPTION_PIF_RENDERER}
          options={collection}
          required={isBonded}
          value={form.pifsId}
        />
      </div>
      <Input
        name='nameLabel'
        onChange={handleChange}
        required
        value={form.nameLabel}
        label={<IntlMessage id='name' />}
        sx={INPUT_STYLES}
      />
      <Input
        name='description'
        onChange={handleChange}
        type='text'
        value={form.description}
        label={<IntlMessage id='description' />}
        sx={INPUT_STYLES}
      />
      <Input
        name='mtu'
        onChange={handleChange}
        type='number'
        value={form.mtu}
        label={<IntlMessage id='mtu' />}
        sx={INPUT_STYLES}
        helperText={<IntlMessage id='defaultValue' values={{ value: 1500 }} />}
      />
      {isBonded ? (
        <div>
          <label>
            <IntlMessage id='bondMode' />
          </label>
          <Select
            name='bondMode'
            onChange={handleChange}
            options={BOND_MODE}
            required
            sx={INPUT_STYLES}
            value={form.bondMode}
          />
        </div>
      ) : (
        <Input
          name='vlan'
          onChange={handleChange}
          type='number'
          value={form.vlan}
          label={<IntlMessage id='vlan' />}
          sx={INPUT_STYLES}
          helperText={<IntlMessage id='vlanPlaceholder' />}
        />
      )}
      <Button disabled={isLoading} type='submit' color='success' startIcon={<AddIcon />} sx={BUTTON_STYLES}>
        <IntlMessage id='create' />
      </Button>
      <Button disabled={isLoading} onClick={resetForm} sx={BUTTON_STYLES} startIcon={<SettingsBackupRestoreIcon />}>
        <IntlMessage id='reset' />
      </Button>
    </form>
  )
)

export default AddNetwork
