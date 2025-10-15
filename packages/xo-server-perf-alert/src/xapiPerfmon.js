// @ts-check

import { AlertDefinitions } from "./definitions"

const { asyncEach } = require("@vates/async-each")

 
/**
 * @import {XoAlarm, XoHost, XoSr, XoVm} from "@vates/types"
 */

const OTHER_PROPERTY_NAME = {
    'host': 'otherConfig',
    'SR': 'other_config',
    VM: 'other',
}
export class XapiPerfmon{
    #xo
    /**
     * @type {AlertDefinitions}
     */
    #definitions

    /**
     * 
     * @param {*} xo 
     * @param {*} alertDefinitions 
     */
    
    constructor(xo, alertDefinitions){
        console.log({alertDefinitions})
        this.#xo = xo
        this.#definitions = new AlertDefinitions(alertDefinitions) 
        console.log(this.#definitions)
    }

    async init(){
      //  this.watchCollection().catch(console.error)
        await asyncEach( Object.values(this.#xo.getObjects()), async xoObject=>{
            if(xoObject.type !== 'host' /*&& xoObject.type !=='SR' && xoObject.type !== 'VM'*/){
                return
            }
            await this.updateObjectPerfmon(xoObject)
        })
    }

    /**
     * 
     * @param {XoHost|XoSr|XoVm} xoObject 
     */
    #getPerfmon(xoObject){
        return xoObject[OTHER_PROPERTY_NAME[xoObject.type]].perfmon
    }

    /**
     * 
     * @param {XoHost|XoSr|XoVm>} xoObject 
     * @param {Array<AlertDefinition>} alertDefinitions 
     * @returns {string|null}
     */

    computePerfmon(xoObject,alertDefinitions){
        if(alertDefinitions.length ===0){
            return null
        }

        let perfmon = '<config>'
        const TO_PERFMON_TYPE = {
            'cpuUsage': 'cpu_usage',
            'memoryUsage': 'mem_usage',
            'storageUsage': 'fs_usage'
        }

        const TO_SENSE = {
            '<': 'low', 
            '>':'high'
        }

    
        for(const definition of alertDefinitions){
            let level = Number(definition.triggerLevel) // ensure number
            let name 
            let comparator 
            console.log({name, definition})


            //host don't have rule with memory_usage, but the memory size should be quite stable and 
            // it should be recomputed on host change 
            if(definition.variableName === 'memoryUsage' && xoObject.type === 'host') {
                name = 'memory_free_kib' 
                level = xoObject.memory.size * (100-level)/100 
                comparator = definition.comparator === '>' ? 'low' : 'high'
            }else {
                name = TO_PERFMON_TYPE[definition.variableName]
                comparator = TO_SENSE[definition.comparator]
            }
            perfmon +=`
                <variable> 
                    <name value="${name}"/>
                    <alarm_trigger_level value="${level}"/>
                    <alarm_trigger_sense value="${comparator}"/>
                </variable>
                `
           // <variable> <name value="cpu_usage"/> <alarm_trigger_level value="0.5"/> </variable>
        }
        perfmon +='</config>'
        return perfmon
    }
    /**
     * 
     * @param {XoHost|XoSr|XoVm} xoObject 
     * @param {string|null} perfmon 
     */
    async #setPerfmon(xoObject, perfmon){ 
       await  this.#xo.getXapi(xoObject.uuid).setFieldEntry(xoObject.type,  xoObject._xapiRef, 'other_config',  'perfmon' , perfmon)
       console.log('setPerfmon done', xoObject.uuid, perfmon)
    }

    /**
     * 
     * @param {XoSr | XoVm|XoHost} xoObject 
     */
    async updateObjectPerfmon(xoObject){
        const definitions = this.#definitions.getObjectAlerts(xoObject)
        
        const perfmon = this.computePerfmon(xoObject,definitions)
        const current = this.#getPerfmon(xoObject)
        if(perfmon !== current ){
            return this.#setPerfmon(xoObject, perfmon)
        }
    }


    async watchCollection(){
        // new VM / host 
        //  call th
        
    }

    async updateDefinition(){
        await this.init()
    }

    /**
     * @returns {Promise<Array<XoAlarm>>}
     */
    async getActiveAlarms(){ 
        return []
    }

    async clearAlarms(){
        const alarms = await this.getActiveAlarms()
        asyncEach(alarms, async alarm =>{

        })
    }
}