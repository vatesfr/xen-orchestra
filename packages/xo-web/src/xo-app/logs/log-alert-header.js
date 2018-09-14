import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import ButtonGroup from 'button-group'
import CopyToClipboard from 'react-copy-to-clipboard'
import Icon from 'icon'
import React from 'react'
import ReportBugButton, { CAN_REPORT_BUG } from 'report-bug-button'
import Tooltip from 'tooltip'
import { get } from 'xo-defined'
import { subscribeBackupNgLogs } from 'xo'

export default [
  addSubscriptions(({ id }) => ({
    log: cb =>
      subscribeBackupNgLogs(logs => {
        cb(logs[id])
      }),
  })),
  ({ log = {}, jobs }) => {
    const formattedLog = JSON.stringify(log, null, 2)
    return (
      <span>
        {get(() => jobs[log.jobId].name) || 'Job'} (
        {get(() => log.jobId.slice(4, 8))}){' '}
        <span style={{ fontSize: '0.5em' }} className='text-muted'>
          {log.id}
        </span>{' '}
        <ButtonGroup>
          <Tooltip content={_('copyToClipboard')}>
            <CopyToClipboard text={formattedLog}>
              <Button size='small'>
                <Icon icon='clipboard' />
              </Button>
            </CopyToClipboard>
          </Tooltip>
          {CAN_REPORT_BUG && (
            <ReportBugButton
              message={`\`\`\`json\n${formattedLog}\n\`\`\``}
              size='small'
              title='Backup job failed'
            />
          )}
        </ButtonGroup>
      </span>
    )
  },
].reduceRight((value, decorator) => decorator(value))
