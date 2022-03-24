import AddIcon from '@mui/icons-material/Add'
import React from 'react'
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore'
import { Map } from 'immutable'
import { FormControl, FormHelperText, SelectChangeEvent, styled } from '@mui/material'
import { withState } from 'reaclette'

import ActionButton from './ActionButton'
import Button from './Button'
import Checkbox from './Checkbox'
import Input from './Input'
import IntlMessage, { translate } from './IntlMessage'
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
    bondMode?: string
    description?: string
    isBonded: boolean
    isEmptyBondMode: boolean
    isEmptyLabel: boolean
    isInterfacesLimit: boolean
    isLoading: boolean
    mtu?: string
    nameLabel?: string
    pifIds: string[]
    vlan?: string
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
  filteredPifs?: Pif[]
  pifsMetrics?: Map<string, PifMetrics>
  pifOptionRenderer?: (pif: Pif) => string
}

const BUTTON_STYLES = {
  marginRight: '1em',
  width: 'fit-content',
}

const StyledFormControl = styled(FormControl)({
  marginBottom: '1em',
  width: '100%',
})

const StyledLabel = styled('label')<{ error?: boolean }>(({ theme, error }) => ({
  color: error ? theme.palette.error.main : 'initial',
}))

const getInitialFormState = (): State['form'] => ({
  bondMode: undefined,
  description: undefined,
  isBonded: false,
  isEmptyBondMode: false,
  isEmptyLabel: false,
  isInterfacesLimit: false,
  isLoading: false,
  mtu: undefined,
  nameLabel: undefined,
  pifIds: [],
  vlan: undefined,
})

const AddNetwork = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      form: getInitialFormState(),
    }),
    computed: {
      pifsMetrics: state => state.objectsByType.get('PIF_metrics'),
      filteredPifs: state =>
        state.objectsByType
          .get('PIF')
          ?.filter(pif => pif.VLAN === -1 && pif.bond_slave_of === 'OpaqueRef:NULL' && pif.host === pif.$pool.master)
          .sortBy(pif => pif.device)
          .valueSeq()
          .toArray(),
      pifOptionRenderer:
        ({ pifsMetrics }) =>
        (pif: Pif) =>
          `${pif.device} (${
            pifsMetrics?.find(metrics => metrics.$ref === pif.metrics)?.device_name ?? translate({ id: 'unknown' })
          })`,
    },
    effects: {
      createNetwork: async function () {
        const { bondMode, description, isBonded, mtu, nameLabel, pifIds, vlan } = this.state.form
        if (nameLabel === undefined) {
          this.state.form = {
            ...this.state.form,
            isEmptyLabel: true,
          }
        }
        if (isBonded) {
          if (bondMode === undefined) {
            this.state.form = {
              ...this.state.form,
              isEmptyBondMode: true,
            }
          }
          if (pifIds.length < 2) {
            this.state.form = {
              ...this.state.form,
              isInterfacesLimit: true,
            }
          }
        }
        if (this.state.form.isEmptyLabel || this.state.form.isEmptyBondMode || this.state.form.isInterfacesLimit) {
          return
        }
        this.state.form = {
          ...this.state.form,
          isLoading: true,
        }
        try {
          await this.state.xapi.createNetworks([
            {
              MTU: mtu === '' ? undefined : mtu,
              name_description: description ?? '',
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              name_label: nameLabel!,
              VLAN: vlan === '' ? undefined : vlan,
              bondMode: bondMode === '' ? undefined : bondMode,
              pifIds: pifIds.length < 1 ? undefined : pifIds,
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
        } finally {
          this.state.form = {
            ...this.state.form,
            isLoading: false,
          }
        }
      },
      handleChange: function ({ target: { name, value } }) {
        const { form } = this.state
        if (name === 'bondMode') {
          form.isEmptyBondMode = false
        }
        if (name === 'nameLabel') {
          form.isEmptyLabel = false
        }
        if (name === 'pifIds') {
          form.isInterfacesLimit = false
          value = form.isBonded ? value : [value]
        }

        this.state.form = {
          ...form,
          [name]: value,
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
      filteredPifs,
      pifsMetrics,
      pifOptionRenderer,
      form: {
        bondMode,
        description,
        isBonded,
        isEmptyBondMode,
        isInterfacesLimit,
        isEmptyLabel,
        isLoading,
        mtu,
        nameLabel,
        pifIds,
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
        <StyledFormControl error={isInterfacesLimit}>
          <StyledLabel error={isInterfacesLimit}>
            <IntlMessage id='interface' values={{ nInterfaces: isBonded ? 2 : 1 }} />
            {isBonded && ' *'}
          </StyledLabel>
          <Select
            additionalProps={{ pifsMetrics }}
            error={isInterfacesLimit}
            multiple={isBonded}
            name='pifIds'
            onChange={handleChange}
            optionRenderer={pifOptionRenderer}
            options={filteredPifs}
            required={isBonded}
            value={isBonded ? pifIds : pifIds[0]}
          />
          {isInterfacesLimit && (
            <FormHelperText>
              <IntlMessage id='errorBondedNetworkCreationPifs' />
            </FormHelperText>
          )}
        </StyledFormControl>
      </div>
      <StyledFormControl error={isEmptyLabel}>
        <Input
          error={isEmptyLabel}
          name='nameLabel'
          onChange={handleChange}
          required
          value={nameLabel}
          label={<IntlMessage id='name' />}
        />
        {isEmptyLabel && (
          <FormHelperText>
            <IntlMessage id='errorNetworkCreationName' />
          </FormHelperText>
        )}
      </StyledFormControl>

      <StyledFormControl>
        <Input
          name='description'
          onChange={handleChange}
          type='text'
          value={description}
          label={<IntlMessage id='description' />}
        />
      </StyledFormControl>
      <StyledFormControl>
        <Input
          name='mtu'
          onChange={handleChange}
          type='number'
          value={mtu}
          label={<IntlMessage id='mtu' />}
          helperText={<IntlMessage id='defaultValue' values={{ value: 1500 }} />}
        />
      </StyledFormControl>

      {isBonded ? (
        <StyledFormControl error={isEmptyBondMode}>
          <StyledLabel error={isEmptyBondMode}>
            <IntlMessage id='bondMode' /> *
          </StyledLabel>
          <Select
            error={isEmptyBondMode}
            name='bondMode'
            onChange={handleChange}
            options={BOND_MODE}
            required
            value={bondMode}
          />
          {isEmptyBondMode && (
            <FormHelperText>
              <IntlMessage id='errorBondedNetworkCreationBond' />
            </FormHelperText>
          )}
        </StyledFormControl>
      ) : (
        <StyledFormControl>
          <Input
            name='vlan'
            onChange={handleChange}
            type='number'
            value={vlan}
            label={<IntlMessage id='vlan' />}
            helperText={<IntlMessage id='vlanPlaceholder' />}
          />
        </StyledFormControl>
      )}
      <ActionButton color='success' onClick={createNetwork} startIcon={<AddIcon />} sx={BUTTON_STYLES}>
        <IntlMessage id='create' />
      </ActionButton>
      <Button onClick={resetForm} sx={BUTTON_STYLES} startIcon={<SettingsBackupRestoreIcon />} disabled={isLoading}>
        <IntlMessage id='reset' />
      </Button>
    </form>
  )
)

export default AddNetwork
