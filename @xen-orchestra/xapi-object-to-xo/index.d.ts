// POC FINDING: hand-written, because the transform is untyped JS.
//
// `XapiRecord` is deliberately loose — the enriched object carries dynamically
// generated `$<field>` accessors that no static type describes. The return type
// is `unknown` on purpose: a real extraction would have to either type the 23
// transforms or generate the types, and pretending otherwise here would hide
// exactly the cost this POC is meant to measure.

export type XapiRecord = Record<string, any>

declare function xapiObjectToXo(xapiObject: XapiRecord, dependents?: Record<string, string>): unknown

export default xapiObjectToXo
export { xapiObjectToXo }
