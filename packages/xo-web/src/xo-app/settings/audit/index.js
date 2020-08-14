import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Copiable from 'copiable'
import CopyToClipboard from 'react-copy-to-clipboard'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { alert, chooseAction, form } from 'modal'
import { alteredAuditRecord, missingAuditRecord } from 'xo-common/api-errors'
import { FormattedDate, injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { noop, startCase } from 'lodash'
import { PREMIUM } from 'xoa-plans'
import { User } from 'render-xo-item'
import {
  checkAuditRecordsIntegrity,
  exportAuditRecords,
  fetchAuditRecords,
  generateAuditFingerprint,
} from 'xo'

const getIntegrityErrorRender = ({ nValid, error }) => (
  <p className='text-danger'>
    <Icon icon='alarm' />{' '}
    {_(
      missingAuditRecord.is(error)
        ? 'auditMissingRecord'
        : 'auditAlteredRecord',
      {
        id: (
          <Tooltip content={_('copyToClipboard')}>
            <CopyToClipboard text={error.data.id}>
              <span style={{ cursor: 'pointer' }}>
                {error.data.id.slice(4, 8)}
              </span>
            </CopyToClipboard>
          </Tooltip>
        ),
        n: nValid,
      }
    )}
  </p>
)

const openGeneratedFingerprintModal = ({ fingerprint, nValid, error }) =>
  alert(
    <span>
      <Icon icon='diagnosis' /> {_('auditNewFingerprint')}
    </span>,
    <div>
      {error !== undefined ? (
        <div>
          {getIntegrityErrorRender({ nValid, error })}
          <p>{_('auditSaveFingerprintInErrorInfo')}</p>
        </div>
      ) : (
        <p>{_('auditSaveFingerprintInfo')}</p>
      )}
      <p className='input-group mt-1'>
        <input className='form-control' value={fingerprint} disabled />
        <span className='input-group-btn'>
          <Tooltip content={_('auditCopyFingerprintToClipboard')}>
            <CopyToClipboard text={fingerprint}>
              <Button>
                <Icon icon='clipboard' />
              </Button>
            </CopyToClipboard>
          </Tooltip>
        </span>
      </p>
    </div>
  ).catch(noop)

const openIntegrityFeedbackModal = error =>
  chooseAction({
    icon: 'diagnosis',
    title: _('auditCheckIntegrity'),
    body:
      error !== undefined ? (
        getIntegrityErrorRender(error)
      ) : (
        <p className='text-success'>
          {_('auditIntegrityVerified')} <Icon icon='success' />
        </p>
      ),
    buttons: [
      {
        btnStyle: 'success',
        label: _('auditGenerateNewFingerprint'),
      },
    ],
  }).then(
    () => true,
    () => false
  )

const FingerPrintModalBody = injectIntl(
  ({ intl: { formatMessage }, onChange, value }) => (
    <div>
      <p>{_('auditEnterFingerprintInfo')}</p>
      <div className='form-group'>
        <input
          className='form-control'
          onChange={onChange}
          pattern='[^|]+\|[^|]+'
          placeholder={formatMessage(messages.auditEnterFingerprint)}
          value={value}
        />
      </div>
    </div>
  )
)

const openFingerprintPromptModal = () =>
  form({
    render: ({ onChange, value }) => (
      <FingerPrintModalBody onChange={onChange} value={value} />
    ),
    header: (
      <span>
        <Icon icon='diagnosis' /> {_('auditCheckIntegrity')}
      </span>
    ),
  }).then((value = '') => value.trim(), noop)

const checkIntegrity = async () => {
  const fingerprint = await openFingerprintPromptModal()
  if (fingerprint === undefined) {
    return
  }

  let recentRecord
  if (fingerprint !== '') {
    const [oldest, newest] = fingerprint.split('|')
    recentRecord = newest

    const error = await checkAuditRecordsIntegrity(oldest, newest).then(
      noop,
      error => {
        if (missingAuditRecord.is(error) || alteredAuditRecord.is(error)) {
          return {
            nValid: error.data.nValid,
            error,
          }
        }
        throw error
      }
    )

    const shouldGenerateFingerprint = await openIntegrityFeedbackModal(error)
    if (!shouldGenerateFingerprint) {
      return
    }
  }

  await openGeneratedFingerprintModal(
    await generateAuditFingerprint(recentRecord)
  )
}

const displayRecord = record =>
  alert(
    <span>
      <Icon icon='audit' /> {_('auditRecord')}
    </span>,
    <Copiable tagName='pre'>{JSON.stringify(record, null, 2)}</Copiable>
  )

const INDIVIDUAL_ACTIONS = [
  {
    handler: displayRecord,
    icon: 'preview',
    label: _('displayAuditRecord'),
  },
]

const COLUMNS = [
  {
    itemRenderer: ({ subject: { userId, userName } }) =>
      userId !== undefined ? (
        <User
          defaultRender={
            <Copiable tagName='p' text={userId} className='text-muted'>
              {_('deletedUser', { name: userName })}
            </Copiable>
          }
          id={userId}
          link
          newTab
        />
      ) : (
        <p className='text-muted'>{_('noUser')}</p>
      ),
    name: _('user'),
    sortCriteria: 'subject.userName',
  },
  {
    name: _('ip'),
    valuePath: 'subject.userIp',
  },
  {
    itemRenderer: ({ data, event }) =>
      event === 'apiCall' ? data.method : startCase(event),
    name: _('auditActionEvent'),
    sortCriteria: ({ data, event }) =>
      event === 'apiCall' ? data.method : event,
  },
  {
    itemRenderer: ({ time }) => (
      <FormattedDate
        day='numeric'
        hour='2-digit'
        minute='2-digit'
        month='short'
        second='2-digit'
        value={new Date(time)}
        year='numeric'
      />
    ),
    name: _('date'),
    sortCriteria: 'time',
    sortOrder: 'desc',
  },
]

export default decorate([
  provideState({
    initialState: () => ({
      records: undefined,
    }),
    effects: {
      initialize({ fetchRecords }) {
        return fetchRecords()
      },
      async fetchRecords() {
        this.state.records = await fetchAuditRecords()
      },
    },
  }),
  injectState,
  ({ state, effects }) => (
    <Upgrade place='audit' available={PREMIUM}>
      <div>
        <div className='mt-1 mb-1'>
          <ActionButton
            btnStyle='primary'
            handler={effects.fetchRecords}
            icon='refresh'
            size='large'
          >
            {_('refreshAuditRecordsList')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='primary'
            handler={exportAuditRecords}
            icon='download'
            size='large'
          >
            {_('downloadAuditRecords')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='success'
            handler={checkIntegrity}
            icon='diagnosis'
            size='large'
          >
            {_('auditCheckIntegrity')}
          </ActionButton>
        </div>
        <NoObjects
          collection={state.records}
          columns={COLUMNS}
          component={SortedTable}
          defaultColumn={3}
          emptyMessage={
            <span className='text-muted'>
              <Icon icon='alarm' />
              &nbsp;
              {_('noAuditRecordAvailable')}
            </span>
          }
          individualActions={INDIVIDUAL_ACTIONS}
          stateUrlParam='s'
        />
      </div>
    </Upgrade>
  ),
])
