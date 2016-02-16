import ProxyAgent from 'proxy-agent'

export let agent

export function setup (uri) {
  agent = uri != null
    ? new ProxyAgent(uri)
    : undefined
}

const { env } = process
setup(env.http_proxy || env.HTTP_PROXY)
