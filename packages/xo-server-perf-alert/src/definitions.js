// @ts-check

/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 */


/**
 * 
 * @param {XoSr} sr 
 * @returns {boolean}
 */
function isSrWritable(sr) {
    return sr !== undefined && sr.content_type !== 'iso' && sr.size > 0
} 


export class AlertDefinition{

    /**
     * @type {'>' | '<'}
     */
    comparator

    /**
     * @type {'host' | 'SR' | 'VM'}
     */
    objectType
    /**
     * @type {number}
     */
    triggerLevel

    /**
     * @type {SVGAnimatedNumberList}
     */
    triggerPeriod
    /**
     * @type {boolean}
     */
    smartMode

    /**
     * @type {boolean}
     */
    excludeUuids

    /**
     * @type {Array<string>}
     */
    uuids
    
    /**
     * @type {'cpuUsage' | 'memoryUsage' | 'storageUsage'}
     */
    variableName

    constructor({alarmTriggerLevel, alarmTriggerPeriod, excludeUuids, comparator, objectType , smartMode,uuids, variableName}){
        this.triggerLevel = alarmTriggerLevel
        this.triggerPeriod = alarmTriggerPeriod
        this.excludeUuids = excludeUuids
        this.comparator = comparator
        this.objectType = objectType
        this.smartMode = smartMode
        this.uuids = uuids
        this.variableName = variableName
    }


    /**
     * 
     * @param {XoVm|XoHost|XoSr} xoObject 
     * @returns {boolean}
     */
    isObjectAffected(xoObject){

        if(this.smartMode || this.excludeUuids){
            if(xoObject.type !== this.objectType){
                console.log('not the right tyep ', xoObject.type , this.objectType)
                return false
            }
            if(xoObject.type === 'SR' && !isSrWritable(xoObject)){
                return false
            }
            if(xoObject.type === 'VM' || xoObject.type === 'host'){
                if(xoObject.power_state !== 'Running' ){ 
                    return false 
                }
            }
            if(this.excludeUuids && this.uuids.includes(xoObject.uuid)){
                return false
            }
        } else {
            if(!this.uuids.includes(xoObject.uuid)){
                return false
            }
        }

        return true
    }
}



export class AlertDefinitions {
    #definitions = new Set()
    constructor(configuration){
        for(const definition of configuration.hostMonitors){
            const alert = new AlertDefinition({...definition, objectType: 'host'})
            this.#definitions.add(alert)
        }
    }

    /**
     * 
     * @param {XoVm|XoHost|XoSr} xoObject 
     * @returns {Array<AlertDefinition>}
     */
    getObjectAlerts(xoObject){
        const definitions = []
        for(const definition of this.#definitions){
            console.log({definition})
            if(definition.isObjectAffected(xoObject)){
                definitions.push(definition)
            }
        }
        return definitions
    }

}