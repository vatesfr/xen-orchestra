// Builds the `xapi`-like façade that wrapRecord needs, over any source of
// records. The fixture test feeds it a JSON dump; XO Lite feeds it its XAPI
// events one record at a time. Nothing here knows about either.

import { createRecordWrapper } from './wrapRecord.mjs'

const unsupported = name => () => Promise.reject(new Error(`${name} is not available in this POC façade`))

/**
 * @param {object} [params]
 * @param {Record<string, Record<string, object>>} [params.recordsByType] - initial records, { type: { opaqueRef: rawRecord } }
 * @param {(method: string, ...args: any[]) => Promise<any>} [params.call] - real XAPI call, if any
 */
export function createXapiGraph({ recordsByType = {}, call } = {}) {
  const objectsByRef = new Map()
  let poolRef

  const facade = {
    getObjectByRef: ref => objectsByRef.get(ref),
    // `pool` is read through the `$pool` getter on every wrapped record
    get pool() {
      return objectsByRef.get(poolRef)
    },
    call: call ?? unsupported('call'),
    callAsync: call ?? unsupported('callAsync'),
    setField: unsupported('setField'),
    setFieldEntry: unsupported('setFieldEntry'),
    setFieldEntries: unsupported('setFieldEntries'),
  }

  const wrapRecord = createRecordWrapper(facade)

  const setRecord = (type, ref, data) => {
    objectsByRef.set(ref, wrapRecord(type, ref, data))

    if (type === 'pool') {
      poolRef = ref
    }
  }

  const deleteRecord = ref => {
    objectsByRef.delete(ref)
  }

  for (const [type, records] of Object.entries(recordsByType)) {
    for (const [ref, data] of Object.entries(records)) {
      setRecord(type, ref, data)
    }
  }

  return { facade, getObjectByRef: facade.getObjectByRef, setRecord, deleteRecord }
}
