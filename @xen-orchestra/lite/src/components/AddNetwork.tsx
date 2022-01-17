import AddIcon from '@mui/icons-material/Add'
import React from 'react'
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore'
import { Map } from 'immutable'
import { SelectChangeEvent } from '@mui/material'
import { withState } from 'reaclette'

import ActionButton from './ActionButton'
import Button from './Button'
import Checkbox from './Checkbox'
import Input from './Input'
import IntlMessage from './IntlMessage'
import Select from './Select'
import { alert } from './Modal'

import XapiConnection, { BOND_MODE, ObjectsByType, Pif, PifMetrics } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
  xapi: XapiConnection
}

interface State {
  form: {
    [key: string]: unknown
    bondMode: string
    description: string
    isBonded: boolean
    isEmptyBondMode: boolean
    isEmptyLabel: boolean
    isInsufficientNumberOfInterfaces: boolean
    mtu: string
    nameLabel: string
    pifsId: string[]
    vlan: string
  }
}

interface Props {}

interface ParentEffects {}

interface Effects {
  createNetwork: () => Promise<void>
  handleChange: (e: SelectChangeEvent<unknown> | React.ChangeEvent<{ name: string; value: unknown }>) => void
  resetForm: () => void
  toggleBonded: () => void
}

interface Computed {
  pifsCollection?: Pif[]
  pifs?: Map<string, Pif>
  pifsMetrics?: Map<string, PifMetrics>
}

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

const getInitialFormState = (): State['form'] => ({
  bondMode: '',
  description: '',
  isBonded: false,
  isEmptyBondMode: false,
  isEmptyLabel: false,
  isInsufficientNumberOfInterfaces: false,
  mtu: '',
  nameLabel: '',
  pifsId: [],
  vlan: '',
})

const AddNetwork = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      form: getInitialFormState(),
    }),
    computed: {
      pifs: state => state.objectsByType.get('PIF'),
      pifsMetrics: state => state.objectsByType.get('PIF_metrics'),
      pifsCollection: state =>
        state.pifs
          ?.filter(pif => pif.VLAN === -1 && pif.bond_slave_of === 'OpaqueRef:NULL' && pif.host === pif.$pool.master)
          .sortBy(pif => pif.device)
          .valueSeq()
          .toArray(),
    },
    effects: {
      createNetwork: async function () {
        const { bondMode, description, isBonded, mtu, nameLabel, pifsId, vlan } = this.state.form
        if (nameLabel.trim() === '') {
          this.state.form = {
            ...this.state.form,
            isEmptyLabel: true,
          }
        }
        if (isBonded) {
          if (bondMode === '') {
            this.state.form = {
              ...this.state.form,
              isEmptyBondMode: true,
            }
          }
          if (pifsId.length < 2) {
            this.state.form = {
              ...this.state.form,
              isInsufficientNumberOfInterfaces: true,
            }
          }
        }
        if (
          this.state.form.isEmptyLabel ||
          this.state.form.isEmptyBondMode ||
          this.state.form.isInsufficientNumberOfInterfaces
        ) {
          return
        }
        try {
          await this.state.xapi.createNetworks([
            {
              MTU: +mtu,
              name_description: description,
              name_label: nameLabel,
              VLAN: +vlan,
              bondMode: bondMode === '' ? undefined : bondMode,
              pifsId: pifsId.length < 1 ? undefined : pifsId,
            },
          ])
          this.effects.resetForm()
        } catch (error) {
          console.error(error)
          alert({
            icon: 'exclamation-triangle',
            message: error instanceof Error ? error.message : <IntlMessage id='errorOccurred' />,
            title: <IntlMessage id='networkCreation' />,
          })
        }
      },
      handleChange: function ({ target: { name, value } }) {
        // Reason why form values are initialized with empty string and not a undefined value
        // Warning: A component is changing an uncontrolled input to be controlled.
        // This is likely caused by the value changing from undefined to a defined value,
        // which should not happen. Decide between using a controlled or uncontrolled input
        // element for the lifetime of the component.
        // More info: https://reactjs.org/link/controlled-components
        const { form } = this.state
        if (name === 'bondMode') {
          form.isEmptyBondMode = false
        }
        if (name === 'nameLabel') {
          form.isEmptyLabel = false
        }
        if (name === 'pifsId') {
          form.isInsufficientNumberOfInterfaces = false
          value = form.isBonded ? value : [value]
        }

        if (form[name] !== undefined) {
          this.state.form = {
            ...form,
            [name]: value,
          }
        }
      },
      resetForm: function () {
        this.state.form = getInitialFormState()
      },
      toggleBonded: function () {
        const isBonded = !this.state.form.isBonded
        this.state.form = {
          ...this.state.form,
          isBonded,
        }
      },
    },
  },
  ({
    effects: { createNetwork, handleChange, resetForm, toggleBonded },
    state: {
      pifsCollection,
      pifsMetrics,
      form: {
        bondMode,
        description,
        isBonded,
        isEmptyBondMode,
        isInsufficientNumberOfInterfaces,
        isEmptyLabel,
        mtu,
        nameLabel,
        pifsId,
        vlan,
      },
    },
  }) => (
    <form
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
          <IntlMessage id='interface' values={{ nInterface: isBonded ? 2 : 1 }} />
          {isBonded && ' *'}
        </label>
        <Select
          additionalProps={{ pifsMetrics }}
          containerStyle={INPUT_STYLES}
          error={isInsufficientNumberOfInterfaces}
          multiple={isBonded}
          name='pifsId'
          onChange={handleChange}
          optionRenderer={OPTION_PIF_RENDERER}
          options={pifsCollection}
          required={isBonded}
          value={pifsId}
        />
      </div>
      <Input
        error={isEmptyLabel}
        name='nameLabel'
        onChange={handleChange}
        required
        value={nameLabel}
        label={<IntlMessage id='name' />}
        sx={INPUT_STYLES}
      />
      <Input
        name='description'
        onChange={handleChange}
        type='text'
        value={description}
        label={<IntlMessage id='description' />}
        sx={INPUT_STYLES}
      />
      <Input
        name='mtu'
        onChange={handleChange}
        type='number'
        value={mtu}
        label={<IntlMessage id='mtu' />}
        sx={INPUT_STYLES}
        helperText={<IntlMessage id='defaultValue' values={{ value: 1500 }} />}
      />
      {isBonded ? (
        <div>
          <label>
            <IntlMessage id='bondMode' /> *
          </label>
          <Select
            containerStyle={INPUT_STYLES}
            error={isEmptyBondMode}
            name='bondMode'
            onChange={handleChange}
            options={BOND_MODE}
            required
            value={bondMode}
          />
        </div>
      ) : (
        <Input
          name='vlan'
          onChange={handleChange}
          type='number'
          value={vlan}
          label={<IntlMessage id='vlan' />}
          sx={INPUT_STYLES}
          helperText={<IntlMessage id='vlanPlaceholder' />}
        />
      )}
      <ActionButton color='success' onClick={createNetwork} startIcon={<AddIcon />} sx={BUTTON_STYLES}>
        <IntlMessage id='create' />
      </ActionButton>
      <Button onClick={resetForm} sx={BUTTON_STYLES} startIcon={<SettingsBackupRestoreIcon />}>
        <IntlMessage id='reset' />
      </Button>
    </form>
  )
)

export default AddNetwork
