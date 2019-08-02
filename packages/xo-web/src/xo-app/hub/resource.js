import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Row } from 'grid'
import { alert, form } from 'modal'
import { downloadAndInstallResource } from 'xo'
import { formatSize } from 'utils'
// import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import CreationProgress from './creation-progress'

import ResourceForm from './resource-form'

export default decorate([
  provideState({
    initialState: () => ({
      pool: undefined,
      loading: false,
    }),
    effects: {
      initialize: () => {},
      async install(__, { name, namespace, id, version }) {
        const { isFromSources, pool } = this.state
        if (!isFromSources) {
          alert(
            _('hubResourceAlert'),
            <div>
              <p>
                {_('considerSubscribe', {
                  link: 'https://xen-orchestra.com',
                })}
              </p>
            </div>
          )
        } else if (this.state.pool === undefined) {
          this.effects.showResourceParamsModal({
            namespace,
            id,
            version,
            pool,
            name,
          })
        }
      },
      async showResourceParamsModal(
        __,
        { name, namespace, id, version, pool }
      ) {
        const resourceParams = await form({
          render: props => <ResourceForm {...props} />,
          header: (
            <span>
              <Icon icon='add-vm' /> {name}
            </span>
          ),
          size: 'medium',
          handler: value => {
            return value
          },
        })
        this.state.pool = resourceParams.pool
        this.state.loading = true
        await downloadAndInstallResource({
          namespace,
          id,
          version,
          pool: resourceParams.pool,
        })
        this.state.loading = false
      },
    },
    computed: {
      isFromSources: () => Number(process.env.XOA_PLAN) === 5,
      poolName: ({ pool }) => pool && pool.name_label,
    },
  }),
  injectState,
  ({ name, namespace, popularity, size, version, id, effects, state }) => (
    <Card shadow>
      <CardHeader>{name}</CardHeader>
      <CardBlock className='text-center'>
        <div>
          <span className='text-muted'>OS</span>
          {'  '}
          <strong>Ubuntu</strong>
          <span className='pull-right'>
            {popularity} <Icon icon='plan-trial' />
          </span>
        </div>
        <div>
          <span className='text-muted'>VERSION</span>
          {'  '}
          <strong>{version}</strong>
        </div>
        <div>
          <span className='text-muted'>SIZE</span>
          {'  '}
          <strong>{formatSize(size)}</strong>
        </div>
        <hr />
        {state.poolName !== undefined ? (
          <div>
            <span className='text-muted'>POOL</span>
            {'  '}
            <strong>{state.poolName}</strong>
          </div>
        ) : (
          <br />
        )}
        <br />
        {state.loading ? (
          <CreationProgress key={state.pool.id} pool={state.pool} />
        ) : (
          // <CreationProgress
          //   key={'6d4da817-9f43-56a2-cc5c-2f23469e54cb'}
          //   pool={{
          //     default_SR: 'a5954951-3dfa-42b8-803f-4bc270b22a0b',
          //     HA_enabled: false,
          //     master: 'b54bf91f-51d7-4af5-b1b3-f14dcf1146ee',
          //     tags: [],
          //     name_description: 'Intel Xeon E3-1225',
          //     name_label: 'XenServer',
          //     xosanPackInstallationTime: 1550756113,
          //     cpus: {
          //       cores: 12,
          //       sockets: 3,
          //     },
          //     zstdSupported: false,
          //     id: '6d4da817-9f43-56a2-cc5c-2f23469e54cb',
          //     type: 'pool',
          //     uuid: '6d4da817-9f43-56a2-cc5c-2f23469e54cb',
          //     $pool: '6d4da817-9f43-56a2-cc5c-2f23469e54cb',
          //     $poolId: '6d4da817-9f43-56a2-cc5c-2f23469e54cb',
          //   }}
          // />
          <Row>
            <Col size={6}>
              <ActionButton
                block
                handler={effects.install}
                data-name={name}
                data-namespace={namespace}
                data-id={id}
                data-version={version}
                icon={'add'}
                //   pending={pending}
                //   redirectOnSuccess={redirectOnSuccess}
                size='meduim'
                //   tooltip={display === 'icon' ? label : undefined}
              >
                Install
              </ActionButton>
            </Col>
            <Col size={6}>
              <ActionButton
                block
                //   handler={handler}
                //   handlerParam={handlerParam}
                icon={'add-vm'}
                //   pending={pending}
                //   redirectOnSuccess={redirectOnSuccess}
                size='meduim'
                //   tooltip={display === 'icon' ? label : undefined}
              >
                Deploy
              </ActionButton>
            </Col>
            <br />
          </Row>
        )}
      </CardBlock>
    </Card>
  ),
])
