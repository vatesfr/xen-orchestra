import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Copiable from 'copiable'
import CopyToClipboard from 'react-copy-to-clipboard'
import decorate from 'apply-decorators'
import Dropzone from 'dropzone'
import Icon from 'icon'
import Link from 'link'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { alert, chooseAction, form } from 'modal'
import { alteredAuditRecord, missingAuditRecord } from 'xo-common/api-errors'
import { injectIntl } from 'react-intl'
import { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'
import { noop, startCase } from 'lodash'
import { NumericDate, formatSize } from 'utils'
import { PREMIUM } from 'xoa-plans'
import { User } from 'render-xo-item'
import {
  checkAuditRecordsIntegrity,
  exportAuditRecords,
  fetchAuditRecords,
  generateAuditFingerprint,
  getPlugin,
  importAuditRecords,
} from 'xo'
import RichText from 'rich-text'

const getIntegrityErrorRender = ({ nValid, error }) => (
  <p className='text-danger'>
    <Icon icon='alarm' />{' '}
    {_(missingAuditRecord.is(error) ? 'auditMissingRecord' : 'auditAlteredRecord', {
      id: (
        <Tooltip content={_('copyToClipboard')}>
          <CopyToClipboard text={error.data.id}>
            <span style={{ cursor: 'pointer' }}>{error.data.id.slice(4, 8)}</span>
          </CopyToClipboard>
        </Tooltip>
      ),
      n: nValid,
    })}
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

const FingerPrintModalBody = injectIntl(({ intl: { formatMessage }, onChange, value }) => (
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
))

const openFingerprintPromptModal = () =>
  form({
    render: ({ onChange, value }) => <FingerPrintModalBody onChange={onChange} value={value} />,
    header: (
      <span>
        <Icon icon='diagnosis' /> {_('auditCheckIntegrity')}
      </span>
    ),
  }).then((value = '') => value.trim(), noop)

const checkIntegrity = async ({ handleCheck }) => {
  const fingerprint = await openFingerprintPromptModal()
  if (fingerprint === undefined) {
    return
  }

  let recentRecord
  if (fingerprint !== '') {
    const [oldest, newest] = fingerprint.split('|')
    recentRecord = newest

    const result = await checkAuditRecordsIntegrity(oldest, newest).then(noop, error => {
      if (missingAuditRecord.is(error) || alteredAuditRecord.is(error)) {
        return {
          nValid: error.data.nValid,
          error,
        }
      }
      throw error
    })

    handleCheck(
      oldest,
      newest,
      get(() => result.error)
    )

    const shouldGenerateFingerprint = await openIntegrityFeedbackModal(result)
    if (!shouldGenerateFingerprint) {
      return
    }
  }

  const generatedFingerprint = await generateAuditFingerprint(recentRecord)

  // display coherence feedback
  handleCheck(...generatedFingerprint.fingerprint.split('|'), generatedFingerprint.error)

  await openGeneratedFingerprintModal(generatedFingerprint)
}

const displayRecord = record =>
  alert(
    <span>
      <Icon icon='audit' /> {_('auditRecord')}
    </span>,
    <RichText copiable message={JSON.stringify(record, null, 2)} />
  )

const renderImportStatus = ({
  recordsFile,
  importError,
  importResults: { nInvalid, nMissing, lastLogId } = {},
  importStatus,
}) => {
  switch (importStatus) {
    case 'noFile':
      return _('noAuditRecordsFile')
    case 'selectedFile':
      return <span>{`${recordsFile?.name} (${formatSize(recordsFile?.size)})`}</span>
    case 'start':
      return <Icon icon='loading' />
    case 'end':
      if (nInvalid === 0 && nMissing === 0) {
        return <span className='text-success'>{_('importAuditRecordsSuccess')}</span>
      } else {
        return (
          <span className='text-warning'>
            {_('importAuditRecordsSuccessWithProblems', { nInvalid, nMissing, lastLogId })}
          </span>
        )
      }
    case 'importError':
      return <span className='text-danger'>{_('importAuditRecordsError', { importError: importError || '' })}</span>
  }
}

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
    itemRenderer: ({ data, event }) => (event === 'apiCall' ? data.method : startCase(event)),
    name: _('auditActionEvent'),
    sortCriteria: ({ data, event }) => (event === 'apiCall' ? data.method : event),
  },
  {
    itemRenderer: ({ time }) => <NumericDate timestamp={time} />,
    name: _('date'),
    sortCriteria: 'time',
    sortOrder: 'desc',
  },
  {
    itemRenderer: ({ id }, { checkedRecords, missingRecord }) => {
      if (missingRecord !== id && checkedRecords[id] === undefined) {
        return
      }

      if (missingRecord === id) {
        return (
          <span className='text-danger'>
            <Icon icon='error' /> {_('missing')}
          </span>
        )
      }

      if (checkedRecords[id]) {
        return (
          <span className='text-success'>
            <Icon icon='success' /> {_('verified')}
          </span>
        )
      }

      return (
        <span className='text-danger'>
          <Icon icon='error' /> {_('altered')}
        </span>
      )
    },
    name: _('integrity'),
  },
]

export default decorate([
  provideState({
    initialState: () => ({
      _records: undefined,
      checkedRecords: {},
      goTo: undefined,
      importError: undefined,
      importStatus: 'noFile',
      importResults: undefined,
      missingRecord: undefined,
      recordsFile: undefined,
      showImportDropzone: false,
    }),
    effects: {
      initialize({ fetchRecords }) {
        return fetchRecords()
      },
      async fetchRecords() {
        this.state._records = await fetchAuditRecords()
      },
      showImportDropzone() {
        this.state.showImportDropzone = !this.state.showImportDropzone
      },
      startImportRecords() {
        this.state.importStatus = 'start'

        return importAuditRecords(this.state.recordsFile)
          .then(
            importResults => {
              this.state.recordsFile = undefined
              this.state.importStatus = 'end'
              this.state.importResults = importResults
            },
            error => {
              this.state.recordsFile = undefined
              this.state.importStatus = 'importError'
              this.state.importError = error?.message
            }
          )
          .finally(this.effects.fetchRecords)
      },
      handleDrop(_, files) {
        this.state.recordsFile = files && files[0]
        this.state.importStatus = 'selectedFile'
      },
      unselectFile() {
        this.state.recordsFile = undefined
        this.state.importStatus = 'noFile'
      },
      handleRef(_, ref) {
        if (ref !== null) {
          const component = ref.getWrappedInstance()
          this.state.goTo = component.goTo.bind(component)
        }
      },
      handleCheck(_, oldest, newest, error) {
        const { state } = this
        const checkedRecords = { ...state.checkedRecords }

        if (error !== undefined) {
          const { id } = error.data
          oldest = id

          if (missingAuditRecord.is(error)) {
            state.missingRecord = id
          } else {
            checkedRecords[id] = false
          }

          state.goTo(id)

          // the newest is inaccessible or altered
          if (id === newest) {
            return
          }
        }

        const records = state._records
        let i = records.findIndex(({ id }) => id === newest)
        let record
        do {
          record = records[i]
          checkedRecords[record.id] = true
          i++
        } while (record.previousId !== oldest)

        state.checkedRecords = checkedRecords
      },
    },
    computed: {
      records: ({ _records, missingRecord }) =>
        _records !== undefined && missingRecord !== undefined
          ? [
              ..._records,
              {
                id: missingRecord,
                subject: {},
                time: 0,
              },
            ]
          : _records,
      isUserActionsRecordInactive: async () => {
        const { configuration: { active } = {} } = await getPlugin('audit')

        return !active
      },
    },
  }),
  injectState,
  ({ state, effects }) => (
    <Upgrade place='audit' available={PREMIUM.value}>
      <div>
        <div className='mt-1 mb-1'>
          <ActionButton btnStyle='primary' handler={effects.fetchRecords} icon='refresh' size='large'>
            {_('refreshAuditRecordsList')}
          </ActionButton>{' '}
          <ActionButton btnStyle='primary' handler={exportAuditRecords} icon='download' size='large'>
            {_('downloadAuditRecords')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='success'
            data-handleCheck={effects.handleCheck}
            handler={checkIntegrity}
            icon='diagnosis'
            size='large'
          >
            {_('auditCheckIntegrity')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='warning'
            disabled={state.records?.length > 0}
            handler={effects.showImportDropzone}
            icon='upload'
            size='large'
            tooltip={_('importAuditRecordsTooltip')}
          >
            {_('importAuditRecords')}
          </ActionButton>
        </div>

        {!!state.showImportDropzone && (
          <div>
            <Dropzone onDrop={effects.handleDrop} message={_('importRecordsTip')} />
            {renderImportStatus(state)}
            <div className='form-group pull-right'>
              <ActionButton
                btnStyle='primary'
                className='mr-1'
                disabled={!state.recordsFile}
                handler={effects.startImportRecords}
                icon='import'
                type='submit'
              >
                {_('importAuditRecordsButton')}
              </ActionButton>
              <Button onClick={effects.unselectFile}>{_('importAuditRecordsCleanList')}</Button>
            </div>
          </div>
        )}

        {state.isUserActionsRecordInactive && (
          <p>
            <Link
              className='text-warning'
              to={{
                pathname: '/settings/plugins',
                query: {
                  s: 'id:/^audit$/',
                },
              }}
            >
              <Icon icon='alarm' /> {_('auditInactiveUserActionsRecord')}
            </Link>
          </p>
        )}
        <NoObjects
          collection={state.records}
          columns={COLUMNS}
          component={SortedTable}
          componentRef={effects.handleRef}
          data-checkedRecords={state.checkedRecords}
          data-missingRecord={state.missingRecord}
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
