/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/[...path]': RouteRecordInfo<'/[...path]', '/:path(.*)', { path: ParamValue<true> }, { path: ParamValue<false> }>,
    '/dev/': RouteRecordInfo<'/dev/', '/dev', Record<never, never>, Record<never, never>>,
    '/dev/colors': RouteRecordInfo<'/dev/colors', '/dev/colors', Record<never, never>, Record<never, never>>,
    '/dev/token': RouteRecordInfo<'/dev/token', '/dev/token', Record<never, never>, Record<never, never>>,
    '/host/[id]': RouteRecordInfo<'/host/[id]', '/host/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/host/:id': RouteRecordInfo<'/host/:id', '/host/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/host/[id]/console': RouteRecordInfo<'/host/[id]/console', '/host/:id/console', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/host/[id]/networks': RouteRecordInfo<'/host/[id]/networks', '/host/:id/networks', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/host/[id]/vms': RouteRecordInfo<'/host/[id]/vms', '/host/:id/vms', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/pool/[id]': RouteRecordInfo<'/pool/[id]', '/pool/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/pool/:id': RouteRecordInfo<'/pool/:id', '/pool/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/pool/[id]/hosts': RouteRecordInfo<'/pool/[id]/hosts', '/pool/:id/hosts', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/pool/[id]/networks': RouteRecordInfo<'/pool/[id]/networks', '/pool/:id/networks', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/pool/[id]/vms': RouteRecordInfo<'/pool/[id]/vms', '/pool/:id/vms', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/vm/[id]': RouteRecordInfo<'/vm/[id]', '/vm/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/vm/[id]/console': RouteRecordInfo<'/vm/[id]/console', '/vm/:id/console', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/vm/[id]/networks': RouteRecordInfo<'/vm/[id]/networks', '/vm/:id/networks', { id: ParamValue<true> }, { id: ParamValue<false> }>,
  }
}
