// @ts-check

/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 */

import { AlertDefinition } from "./definitions"


export class Alarm{
    /**
     * @type {AlertDefinition}
     */
    definition

    /**
     * @type {XoHost|XoSr|XoVm}
     */
    target
    /**
     * @type {number}
     */
    level

    /**
     * @type {DateTime}
     */
    since 

    constructor(definition, target, level, since = new Date()){
        this.definition = definition
        this.target = target
        this.level = level
        this.since = since
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