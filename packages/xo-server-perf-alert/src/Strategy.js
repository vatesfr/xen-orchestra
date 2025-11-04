// @ts-check

/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 */

import { AlertDefinition } from "./definitions"



export class Alarm{
    /**
     * @type {AlertDefinition}
     */
    alert

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
     * @param {AlertDefinition} alarmDefinition.alert 
     * @param {XoHost|XoSr|XoVm} alarmDefinition.target 
     * @param {number} alarmDefinition.value 
     */
    constructor({alert,  target,value}){
        this.alert = alert
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
        return Promise.reject('Not Implemented')
    }

    start(){
        return Promise.reject('Not Implemented')
    }

    stop(){
        return Promise.reject('Not Implemented')
    }

}