declare module 'vue-router/auto-routes' {
  import type { ParamValue, RouteRecordInfo } from 'vue-router'

  export interface RouteNamedMap {
    '/dev/': RouteRecordInfo<'/dev/', '/dev', Record<never, never>, Record<never, never>>
    '/dev/colors': RouteRecordInfo<'/dev/colors', '/dev/colors', Record<never, never>, Record<never, never>>
    '/dev/token': RouteRecordInfo<'/dev/token', '/dev/token', Record<never, never>, Record<never, never>>
    '/dev/icons/': RouteRecordInfo<'/dev/icons/', '/dev/icons', Record<never, never>, Record<never, never>>
    '/dev/icons/[name]': RouteRecordInfo<
      '/dev/icons/[name]',
      '/dev/icons/:name',
      { name: ParamValue<true> },
      { name: ParamValue<false> }
    >
  }
}
