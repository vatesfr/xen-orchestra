import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { deleteMessage,
deleteMessages
} from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'

const LOG_COLUMNS = [
  {
    default: true,
    itemRenderer: log => <div>
      <FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={log.time * 1000} />)
    </div>,
    name: _('logDate'),
    sortCriteria: 'time'
  },
  {
    itemRenderer: log => log.name,
    name: _('logName'),
    sortCriteria: 'name'
  },
  {
    itemRenderer: log => log.body,
    name: _('logContent'),
    sortCriteria: 'body'
  }
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: deleteMessage,
    icon: 'delete',
    label: _('logDelete'),
    level: 'danger'
  }
]

const GROUPED_ACTIONS = [
  {
    handler: deleteMessages,
    icon: 'delete',
    label: _('logDeleteSelected'),
    level: 'danger'
  }
]

const collection = [
  {
    'body': 'A possible network anomaly was found. The following hosts possibly have storage PIFs that are not dedicated:\npe1: eth2 (uuid: bf1b5304-30cd-8dd1-67ea-0aa3701995b6)\npe2: eth2 (uuid: 818d15ce-95bc-ea35-260b-2fb323188a47)\npe4: eth2 (uuid: 10b06b15-cc33-1a73-e1b2-ba55a404b7ef)\npe3: eth2 (uuid: ad9fb65d-d20a-a300-b982-5619992317a4)\npe5: eth2 (uuid: 9f5ae516-0277-04bf-3ea1-fedb75586bcb)',
    'name': 'IP_CONFIGURED_PIF_CAN_UNPLUG',
    'time': 1507066016,
    '$object': 'c046eaf2-7189-312f-3083-8bd660c28cd8',
    'id': '05011795-a943-c0f0-481d-08bf5276f583',
    'type': 'message',
    'uuid': '05011795-a943-c0f0-481d-08bf5276f583',
    '$pool': 'c046eaf2-7189-312f-3083-8bd660c28cd8',
    '$poolId': 'c046eaf2-7189-312f-3083-8bd660c28cd8'
  },
  {
    'body': 'A possible network anomaly was found. The following hosts possibly have storage PIFs that are not dedicated:\npe2: eth2 (uuid: 22dfac23-eec2-b585-43dd-97cfcdf4b916)\npe1: eth2 (uuid: 18fdc669-ab30-f8e4-6202-c11ce6ac0b7e)\npe4: eth2 (uuid: dd5e8fe3-7afd-3ba0-d23f-2267a3758453)\npe5: eth2 (uuid: 488e0085-b211-3d34-38aa-dcc190906921)\npe3: eth2 (uuid: 2456dd0f-5b9a-1d4e-5461-f954cd5e89c0)',
    'name': 'IP_CONFIGURED_PIF_CAN_UNPLUG',
    'time': 1507051880,
    '$object': 'c046eaf2-7189-312f-3083-8bd660c28cd8',
    'id': 'e857717b-f770-352a-6bf3-59000db5d1be',
    'type': 'message',
    'uuid': 'e857717b-f770-352a-6bf3-59000db5d1be',
    '$pool': 'c046eaf2-7189-312f-3083-8bd660c28cd8',
    '$poolId': 'c046eaf2-7189-312f-3083-8bd660c28cd8'
  }
]

export default class TabLogs extends Component {
  render () {
    return <SortedTable
      collection={collection}
      columns={LOG_COLUMNS}
      groupedActions={GROUPED_ACTIONS}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s'
    />
  }
}
