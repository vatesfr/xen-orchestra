declare module 'app-conf' {
  function load(name: string, opts?: { appDir?: string; ignoreUnknownFormats?: boolean }): Promise<any>
  export { load }
}
