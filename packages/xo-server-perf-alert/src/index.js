import { createLogger } from '@xen-orchestra/log'
import { AlarmRuleSet } from './definitions.js'

import * as templates from '../src/templates/index.js'
import { XapiSrQuery } from './XapiSrQuery.js' 


const logger = createLogger('xo:xo-server-perf-alert')

logger.debug('DEBUG ENABLED')
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
  enum:['>', '<']
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
            description: 'lol',
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
            description: 'lol',
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
            description: 'lol',
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
 
class PerfAlertXoPlugin {

  /**
   * @type {AlarmRuleSet | undefined}
   */
  #alarmRuleSet

  #configuration

  /**
   * @type {Date | undefined}
   */
  #lastChangeComputation

  /**
   * @type {AbortController| undefined}
   */
  #abortWaitController

  #loaded = true

  constructor(xo) {
    this._xo = xo
  }

  async sendAlarmChange({newAlarms, closedAlarms, activeAlarms, ...other}){
    const byRules = {}
    newAlarms.forEach(alarm=>{
      byRules[alarm.rule.id] = byRules[alarm.rule.id] ?? {alarms:[]}
      byRules[alarm.rule.id].alarms.push({...alarm, url : this._generateUrl(alarm.rule.objectType, alarm.target)})
    })
    if(newAlarms.size >0){
      const {html} =  await templates.mjml.transform(templates.mjml.$newAlarms({byRules}))
      const text =  await templates.markdown.$newAlarms({byRules})
      return this._sendAlertEmail('LET S GO',html, text )
    }
  }

  /**
   * 
   * @param {MonitorStrategy} strategy 
   * @param {AbortController} abortController 
   */
  async #watch(strategy, abortController){
    const minDelay = 60 * 1000 
    // ensure we at least wait for the delay
    // but handle gracefully long running computation
    if(this.#lastChangeComputation){
      const delay = this.#lastChangeComputation + minDelay - Date.now()
      await new Promise((resolve, reject)=>{
        const interval = setTimeout(()=>{
          resolve()
        }, delay)
        abortController.signal.addEventListener("abort", () => {
           clearInterval(interval)
            reject(new Error('Watcher aborted'))
          })
      })
    }

    try{
      const changes = await strategy.computeAlarmChanges()
      if(abortController.signal.aborted){
        return 
      }  
      await this.sendAlarmChange(changes)
    }
    finally{
      if(!abortController.signal.aborted){
        this.#lastChangeComputation = Date.now()
        this.#watch(strategy, abortController)
      }
    }

  }
  async load() {
    if(this.#abortWaitController ){
      return 
    }
    this.#alarmRuleSet = new AlarmRuleSet(this.#configuration)
    const strategy = new XapiSrQuery(this._xo,this.#alarmRuleSet)
    this.#abortWaitController = new AbortController()
    this.#watch(strategy,  this.#abortWaitController).catch(err=>{
      console.error(err)
    })
    
  }

  async unload() {  
    this.#abortWaitController?.abort() 
    this.#abortWaitController  = undefined
  }


  async configure(configuration) { 
    this.#configuration = configuration
    await this.unload()
    await this.load() 
  }

  _generateUrl(type, object) {
    const { baseUrl } = this.#configuration
    const { uuid } = object
    switch (type) {
      case 'VM':
        return `${baseUrl}#/vms/${uuid}/stats`
      case 'host':
        return `${baseUrl}#/hosts/${uuid}/stats`
      case 'sr':
        return `${baseUrl}#/srs/${uuid}/general`
      default:
        return `unknown type ${type}`
    }
  }

  async test() { 
  }



  _sendAlertEmail(subjectSuffix, html, markdown) {
    if (this.#configuration.toEmails !== undefined && this._xo.sendEmail !== undefined) {
      this._xo.sendEmail({
        to: this.#configuration.toEmails,
        subject: `[Xen Orchestra] − Performance Alert ${subjectSuffix}`,
        html,
        text: markdown,
      })
    } else {
      throw new Error('The email alert system has a configuration issue.')
    }
  }

}

exports.default = function ({ xo }) {
  return new PerfAlertXoPlugin(xo)
}
