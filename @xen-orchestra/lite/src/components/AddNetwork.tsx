import AddIcon from '@mui/icons-material/Add'
import React from 'react'
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore'
import { Map } from 'immutable'
import { FormControl, FormHelperText, styled } from '@mui/material'
import { withState } from 'reaclette'

import ActionButton from './ActionButton'
import Button from './Button'
import Checkbox from './Checkbox'
import Input from './Input'
import IntlMessage, { translate } from './IntlMessage'
import Select from './Select'
import { alert } from './Modal'

import XapiConnection, { BOND_MODE, ObjectsByType, Pif, PifMetrics } from '../libs/xapi'
import {
  LinkState,
  LinkStateEffect,
  linkStateEffect,
  ToggleState,
  ToggleStateEffect,
  toggleStateEffect,
} from '../utils/stateManagement'

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
  resetForm: () => void
  _linkState: LinkStateEffect
  _toggleState: ToggleStateEffect
}

interface Computed {
  filteredPifs?: Pif[]
  pifMetrics?: Map<string, PifMetrics>
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
      filteredPifs: state =>
        state.objectsByType
          .get('PIF')
          ?.filter(pif => pif.VLAN === -1 && pif.bond_slave_of === 'OpaqueRef:NULL' && pif.host === pif.$pool.master)
          .sortBy(pif => pif.device)
          .valueSeq()
          .toArray(),
      pifMetrics: state => state.objectsByType.get('PIF_metrics'),
      pifOptionRenderer:
        ({ pifMetrics }) =>
        (pif: Pif) =>
          `${pif.device} (${
            pifMetrics?.find(metrics => metrics.$ref === pif.metrics)?.device_name ?? translate({ id: 'unknown' })
          })`,
    },
    effects: {
      createNetwork: async function () {
        const { bondMode, description, isBonded, mtu, nameLabel, pifIds, vlan } = this.state.form
        if (nameLabel === undefined || nameLabel.trim() === '') {
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
          // https://stackoverflow.com/questions/61370307/can-a-decorator-change-a-methods-signature
          // @ts-expect-error Expected 2 arguments, but got 1.
          await this.state.xapi.createNetworks([
            {
              MTU: mtu,
              name_description: description ?? '',
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              name_label: nameLabel!,
              VLAN: vlan,
              bondMode: bondMode,
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
      resetForm: function () {
        this.state.form = getInitialFormState()
      },
      _linkState: linkStateEffect,
      _toggleState: toggleStateEffect,
    },
  },
  ({
    effects: { createNetwork, resetForm, _linkState, _toggleState },
    state: {
      filteredPifs,
      pifMetrics,
      pifOptionRenderer,
      form: {
        bondMode,
        description,
        isBonded,
        isEmptyBondMode,
        isEmptyLabel,
        isInterfacesLimit,
        isLoading,
        mtu,
        nameLabel,
        pifIds,
        vlan,
      },
    },
  }) => {
    const linkState: LinkState = (name, customValue) => e => _linkState(name, e, customValue)
    const toggleState: ToggleState = name => () => _toggleState(name)
    return (
      <form
        style={{
          width: '20em',
        }}
      >
        <label>
          <IntlMessage id='bondedNetwork' />
        </label>
        <Checkbox checked={isBonded} name='bonded' onChange={toggleState('form.isBonded')} />
        <div>
          <StyledFormControl error={isInterfacesLimit}>
            <StyledLabel error={isInterfacesLimit}>
              <IntlMessage id='interface' values={{ nInterfaces: isBonded ? 2 : 1 }} />
              {isBonded && ' *'}
            </StyledLabel>
            <Select
              additionalProps={{ pifMetrics }}
              error={isInterfacesLimit}
              multiple={isBonded}
              name='pifIds'
              onChange={e => {
                linkState('form.pifIds', ev => {
                  const { value } = ev.target
                  return isBonded ? value : [value]
                })(e)
                linkState('form.isInterfacesLimit')(false)
              }}
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
            label={<IntlMessage id='name' />}
            name='nameLabel'
            onChange={e => {
              linkState('form.nameLabel')(e)
              linkState('form.isEmptyLabel')(false)
            }}
            required
            value={nameLabel}
          />
          {isEmptyLabel && (
            <FormHelperText>
              <IntlMessage id='errorNetworkCreationName' />
            </FormHelperText>
          )}
        </StyledFormControl>

        <StyledFormControl>
          <Input
            label={<IntlMessage id='description' />}
            name='description'
            onChange={linkState('form.description')}
            type='text'
            value={description}
          />
        </StyledFormControl>
        <StyledFormControl>
          <Input
            helperText={<IntlMessage id='defaultValue' values={{ value: 1500 }} />}
            label={<IntlMessage id='mtu' />}
            name='mtu'
            onChange={linkState('form.mtu')}
            type='number'
            value={mtu}
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
              onChange={e => {
                linkState('form.bondMode')(e)
                linkState('form.isEmptyBondMode')(false)
              }}
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
              helperText={<IntlMessage id='vlanPlaceholder' />}
              label={<IntlMessage id='vlan' />}
              name='vlan'
              onChange={linkState('form.vlan')}
              type='number'
              value={vlan}
            />
          </StyledFormControl>
        )}
        <ActionButton color='success' onClick={createNetwork} startIcon={<AddIcon />} sx={BUTTON_STYLES}>
          <IntlMessage id='create' />
        </ActionButton>
        <Button disabled={isLoading} onClick={resetForm} startIcon={<SettingsBackupRestoreIcon />} sx={BUTTON_STYLES}>
          <IntlMessage id='reset' />
        </Button>
      </form>
    )
  }
)

export default AddNetwork
