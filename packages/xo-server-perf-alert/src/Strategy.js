// @ts-check

/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 * @import {AlarmRule} from "./definitions"
 */

export class Alarm{
    /**
     * @type {AlarmRule}
     */
    rule

    /**
     * @type {number}
     */
    value

    /**
     * @type {XoHost|XoSr|XoVm}
     */
    target

    /**
     * 
     * @param {object} alarmDefinition Defition of the alarm
     * @param {AlarmRule} alarmDefinition.rule 
     * @param {XoHost|XoSr|XoVm} alarmDefinition.target 
     * @param {number} alarmDefinition.value 
     */
    constructor({ rule,  target,value}){
        this.rule = rule
        this.target = target
        this.value = value
    }
}


export class MonitorStrategy {
    
    /**
     * 
     * @returns {Promise<Array<Alarm>>}
     */
    getActiveAlarms(){
        return Promise.reject(new Error('Not Implemented'))
    }

    start(){
        return Promise.reject(new Error('Not Implemented'))
    }

    stop(){
        return Promise.reject(new Error('Not Implemented'))
    }

}