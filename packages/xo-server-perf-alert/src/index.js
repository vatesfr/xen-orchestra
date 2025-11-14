import { createLogger } from '@xen-orchestra/log'
import { AlarmRuleSet } from './rules.js'

import * as templates from '../src/templates/index.js'
// import { XapiSrQuery } from './XapiSrQuery.js' 
import { RrdHostVm } from './RrdHostVm.js'
export {configurationSchema} from './schema.js'

const logger = createLogger('xo:xo-server-perf-alert')

logger.debug('DEBUG ENABLED')

 
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
    const strategy = new RrdHostVm(this._xo,this.#alarmRuleSet)
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
