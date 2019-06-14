import _, { messages } from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Wizard, { Section } from 'wizard'
import { addSubscriptions, connectStore } from 'utils'
import {
  createBondedNetwork,
  createNetwork,
  createPrivateNetwork,
  getBondModes,
  subscribePlugins,
} from 'xo'
import { createGetObject, getIsPoolAdmin } from 'selectors'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { linkState } from 'reaclette-utils'
import { map } from 'lodash'
import { Select, Toggle } from 'form'
import { SelectPif, SelectPool } from 'select-objects'

import Page from '../../page'
import styles from './index.css'

const EMPTY = {
  bonded: false,
  bondMode: undefined,
  isPrivate: false,
  description: '',
  mtu: '',
  name: '',
  pif: undefined,
  pifs: [],
  vlan: '',
}

const NewNetwork = decorate([
  addSubscriptions({
    plugins: subscribePlugins,
  }),
  connectStore(() => ({
    isPoolAdmin: getIsPoolAdmin,
    pool: createGetObject((_, props) => props.location.query.pool),
  })),
  injectIntl,
  provideState({
    initialState: () => ({ ...EMPTY, bondModes: undefined }),
    effects: {
      initialize: async () => ({ bondModes: await getBondModes() }),
      linkState,
      onChangeMode: (_, bondMode) => ({ bondMode }),
      onChangePif: (_, value) => ({ bonded }) =>
        bonded ? { pifs: value } : { pif: value },
      reset: () => EMPTY,
      toggleBonded: () => ({ bonded, isPrivate }) => ({
        ...EMPTY,
        bonded: !bonded,
        isPrivate: bonded ? isPrivate : false,
      }),
      togglePrivate() {
        const { bonded, isPrivate } = this.state
        return {
          ...EMPTY,
          isPrivate: !isPrivate,
          bonded: isPrivate ? bonded : false,
        }
      },
    },
    computed: {
      modeOptions: ({ bondModes }) =>
        bondModes !== undefined
          ? bondModes.map(mode => ({
              label: mode,
              value: mode,
            }))
          : [],
      pifPredicate: (_, { pool }) => pif =>
        pif.vlan === -1 && pif.$host === (pool && pool.master),
      isSdnControllerLoaded: (state, { plugins = [] }) =>
        plugins.some(
          plugin => plugin.name === 'sdn-controller' && plugin.loaded
        ),
    },
  }),
  injectState,
  class extends Component {
    static contextTypes = {
      router: PropTypes.object,
    }

    _create = () => {
      const { pool, state } = this.props
      const {
        bonded,
        bondMode,
        isPrivate,
        description,
        mtu,
        name,
        pif,
        pifs,
        vlan,
      } = state
      return bonded
        ? createBondedNetwork({
            bondMode: bondMode.value,
            description,
            mtu,
            name,
            pifs: map(pifs, 'id'),
            pool: pool.id,
            vlan,
          })
        : isPrivate
        ? createPrivateNetwork({
            poolId: pool.id,
            networkName: name,
            networkDescription: description,
          })
        : createNetwork({
            description,
            mtu,
            name,
            pif: pif == null ? undefined : pif.id,
            pool: pool.id,
            vlan,
          })
    }

    _selectPool = pool => {
      const {
        effects,
        location: { pathname },
      } = this.props
      effects.reset()
      this.context.router.push({
        pathname,
        query: pool !== null && { pool: pool.id },
      })
    }

    _renderHeader = () => {
      const { isPoolAdmin, pool } = this.props
      return (
        <h2>
          {isPoolAdmin
            ? _('createNewNetworkOn', {
                select: (
                  <span className={styles.inlineSelect}>
                    <SelectPool onChange={this._selectPool} value={pool} />
                  </span>
                ),
              })
            : _('createNewNetworkNoPermission')}
        </h2>
      )
    }

    render() {
      const { state, effects, intl, pool } = this.props
      const {
        bonded,
        bondMode,
        isPrivate,
        description,
        modeOptions,
        mtu,
        name,
        pif,
        pifPredicate,
        pifs,
        vlan,
        isSdnControllerLoaded,
      } = state
      const { formatMessage } = intl
      return (
        <Page header={this._renderHeader()}>
          {pool !== undefined && (
            <form id='networkCreation'>
              <Wizard>
                <Section icon='network' title='newNetworkType'>
                  <div>
                    <Toggle onChange={effects.toggleBonded} value={bonded} />{' '}
                    <label>{_('bondedNetwork')}</label>
                  </div>
                  <div>
                    <Toggle
                      disabled={!isSdnControllerLoaded}
                      onChange={effects.togglePrivate}
                      value={isPrivate}
                    />{' '}
                    <label>{_('privateNetwork')}</label>
                  </div>
                </Section>
                <Section icon='info' title='newNetworkInfo'>
                  {isPrivate ? (
                    <div className='form-group'>
                      <label>{_('newNetworkName')}</label>
                      <input
                        className='form-control'
                        name='name'
                        onChange={effects.linkState}
                        required
                        type='text'
                        value={name}
                      />
                      <label>{_('newNetworkDescription')}</label>
                      <input
                        className='form-control'
                        name='description'
                        onChange={effects.linkState}
                        type='text'
                        value={description}
                      />
                    </div>
                  ) : (
                    <div className='form-group'>
                      <label>{_('newNetworkInterface')}</label>
                      <SelectPif
                        multi={bonded}
                        onChange={effects.onChangePif}
                        predicate={pifPredicate}
                        required={bonded}
                        value={bonded ? pifs : pif}
                      />
                      <label>{_('newNetworkName')}</label>
                      <input
                        className='form-control'
                        name='name'
                        onChange={effects.linkState}
                        required
                        type='text'
                        value={name}
                      />
                      <label>{_('newNetworkDescription')}</label>
                      <input
                        className='form-control'
                        name='description'
                        onChange={effects.linkState}
                        type='text'
                        value={description}
                      />
                      <label>{_('newNetworkMtu')}</label>
                      <input
                        className='form-control'
                        name='mtu'
                        onChange={effects.linkState}
                        placeholder={formatMessage(
                          messages.newNetworkDefaultMtu
                        )}
                        type='text'
                        value={mtu}
                      />
                      {bonded ? (
                        <div>
                          <label>{_('newNetworkBondMode')}</label>
                          <Select
                            onChange={effects.onChangeMode}
                            options={modeOptions}
                            required
                            value={bondMode}
                          />
                        </div>
                      ) : (
                        <div>
                          <label>{_('newNetworkVlan')}</label>
                          <input
                            className='form-control'
                            name='vlan'
                            onChange={effects.linkState}
                            placeholder={formatMessage(
                              messages.newNetworkDefaultVlan
                            )}
                            type='text'
                            value={vlan}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Section>
              </Wizard>
              <div className='form-group pull-right'>
                <ActionButton
                  btnStyle='primary'
                  className='mr-1'
                  form='networkCreation'
                  handler={this._create}
                  icon='new-network-create'
                  redirectOnSuccess={`pools/${pool.id}/network`}
                >
                  {_('newNetworkCreate')}
                </ActionButton>
                <ActionButton handler={effects.reset} icon='reset'>
                  {_('formReset')}
                </ActionButton>
              </div>
            </form>
          )}
        </Page>
      )
    }
  },
])
export { NewNetwork as default }
