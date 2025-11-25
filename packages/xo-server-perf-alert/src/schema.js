const PARAMS_JSON_SCHEMA = [
  {
    properties: {
      uuids: { type: 'array', minItems: 1 },
      smartMode: { anyOf: [{ not: {} }, { const: false }] },
      // we allow smartMode=false with excludeUuids=true because UI is not very clear, and we can't enforce smartMode value when excludeUuids=true
      excludeUuids: { anyOf: [{ not: {} }, { const: true }, { const: false }] },
    },
    required: ['uuids'],
  },
  // "smartMode" can be true ONLY if "uuids" is NOT defined OR if "excludeUuids" is true
  {
    properties: {
      smartMode: { const: true },
      // after being edited, uuids will be an empty list instead of undefined
      uuids: { anyOf: [{ not: {} }, { type: 'array', maxItems: 0 }] },
    },
    required: ['smartMode'],
  },
  {
    properties: {
      uuids: { type: 'array', minItems: 1 },
      smartMode: { const: true },
      excludeUuids: { const: true },
    },
    required: ['uuids', 'smartMode', 'excludeUuids'],
  },
]

const COMPARATOR_ENTRY = {
  title: 'Comparator',
  type: 'string',
  default: '>',
  enum: ['>', '<'],
}

export const configurationSchema = {
  type: 'object',
  properties: {
    baseUrl: {
      type: 'string',
      title: 'Xen Orchestra URL',
      description: 'URL used in alert messages to quickly get to the VMs (ex: https://xoa.company.tld/ )',
    },
    hostMonitors: {
      type: 'array',
      title: 'Host Monitors',
      description:
        'Alarms checking hosts on all pools. The selected performance counter is sampled regularly and averaged. ' +
        'The Average is compared to the threshold and an alarm is raised upon crossing',
      items: {
        type: 'object',
        properties: {
          smartMode: {
            title: 'All running hosts',
            type: 'boolean',
            description: 'When enabled, all running hosts will be considered for the alert.',
            default: false,
          },
          excludeUuids: {
            description: 'If set to true, selected host will not be monitored.',
            title: 'Exclude hosts',
            type: 'boolean',
          },
          uuids: {
            description:
              'List of hosts to monitor if "All running hosts" is disabled, or to not monitor if "Exclude hosts" is enabled.',
            title: 'Hosts',
            type: 'array',
            items: {
              type: 'string',
              $type: 'Host',
            },
          },
          variableName: {
            description: 'Metric to monitor',
            title: 'Alarm Type',
            type: 'string',
            default: 'cpuUsage',
            enum: ['cpuUsage', 'memoryUsage'],
          },
          comparator: COMPARATOR_ENTRY,
          alarmTriggerLevel: {
            title: 'Threshold',
            description: 'The direction of the crossing is given by the comparator type',
            type: 'number',
            default: 40,
          },
          alarmTriggerPeriod: {
            title: 'Average Length (s)',
            description:
              'The points are averaged this number of seconds then the average is compared with the threshold',
            type: 'number',
            default: 60,
            enum: [60, 600],
          },
        },
        oneOf: PARAMS_JSON_SCHEMA,
      },
    },
    vmMonitors: {
      type: 'array',
      title: 'VM Monitors',
      description:
        'Alarms checking all VMs on all pools. The selected performance counter is sampled regularly and averaged. ' +
        'The Average is compared to the threshold and an alarm is raised upon crossing',
      items: {
        type: 'object',
        properties: {
          smartMode: {
            title: 'All running VMs',
            type: 'boolean',
            description: 'When enabled, all running VMs will be considered for the alert.',
            default: false,
          },
          excludeUuids: {
            description: 'If set to true, selected VMs will not be considered for the alert.',
            title: 'Exclude VMs',
            type: 'boolean',
          },
          uuids: {
            description:
              'List of VMs to monitor if "All running VMs" is disabled, or to not monitor if "Exclude VMs" is enabled.',
            title: 'Virtual Machines',
            type: 'array',
            items: {
              type: 'string',
              $type: 'VM',
            },
          },
          variableName: {
            description: 'Metric to monitor',
            title: 'Alarm Type',
            type: 'string',
            default: 'cpuUsage',
            enum: ['cpuUsage', 'memoryUsage'],
          },
          comparator: COMPARATOR_ENTRY,
          alarmTriggerLevel: {
            title: 'Threshold',
            description: 'The direction of the crossing is given by the comparator type',
            type: 'number',
            default: 40,
          },
          alarmTriggerPeriod: {
            title: 'Average Length (s)',
            description:
              'The points are averaged this number of seconds then the average is compared with the threshold',
            type: 'number',
            default: 60,
            enum: [60, 600],
          },
        },
        oneOf: PARAMS_JSON_SCHEMA,
      },
    },
    srMonitors: {
      type: 'array',
      title: 'SR Monitors',
      description:
        'Alarms checking all SRs on all pools. The selected performance counter is sampled regularly and averaged. ' +
        'The Average is compared to the threshold and an alarm is raised upon crossing',
      items: {
        type: 'object',
        properties: {
          smartMode: {
            title: 'All SRs',
            type: 'boolean',
            description: 'When enabled, all SRs will be considered for the alert.',
            default: false,
          },
          excludeUuids: {
            description: 'If set to true, selected SRs will not be considered for the alert.',
            title: 'Exclude SRs',
            type: 'boolean',
          },
          uuids: {
            description:
              'List of SRs to monitor if "All SRs" is disabled, or to not monitor if "Exclude SRs" is enabled.',
            title: 'SRs',
            type: 'array',
            items: {
              type: 'string',
              $type: 'SR',
            },
          },
          variableName: {
            description: 'Metric to monitor',
            title: 'Alarm Type',
            type: 'string',
            default: 'srUsage',
            enum: ['srUsage'],
          },
          comparator: COMPARATOR_ENTRY,
          alarmTriggerLevel: {
            title: 'Threshold',
            description: 'The direction of the crossing is given by the comparator type',
            type: 'number',
            default: 80,
          },
        },
        oneOf: PARAMS_JSON_SCHEMA,
      },
    },
    toEmails: {
      type: 'array',
      title: 'Email addresses',
      description: 'Email addresses of the alert recipients',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
  },
}
