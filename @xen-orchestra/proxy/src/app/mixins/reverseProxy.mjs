import { createLogger } from '@xen-orchestra/log'
import { urlToHttpOptions } from 'url' //node  14.18.0, 15.7.0 is it ok ?
import proxy from 'http2-proxy'

const RE_ABSOLUTE_URL = new RegExp('^(?:[a-z]+:)?//', 'i')

const { debug, warn } = createLogger('xo:proxy:reverse-proxy')

function removeSlash(str){
  return str.replace(/^\/|\/$/g, '')
}

function mergeUrl(relative, base){
  const res = new URL(base)
  const relativeUrl = new URL(relative, base)
  res.pathname = relativeUrl.pathname
  relativeUrl.searchParams.forEach((value, name)=>{
    // we do not allow to modify params already specified by config
    if(!res.searchParams.has(name)){
      res.searchParams.append(name, value)
    }
  })
  res.hash = relativeUrl.hash.length > 0 ? relativeUrl.hash: res.hash
  return res
}
export default class ReverseProxy {
  constructor(app, { httpServer }) {
    this.httpServer = httpServer
    this.app = app
    this.configs = {}
    for(const [proxyId, {path, target, ...options}] of Object.entries(app.config.get('reverseProxies'))){
      this.configs[proxyId] = {
        path: '/proxy/v1/'+removeSlash(path),
        target: new URL(target),
        options
      }
      this.setupOneProxy(proxyId)
    }
  }

  localToBackendUrl(proxyId, localPath){
    const { path:basePath, target } = this.configs[proxyId]
    let localPathWithoutBase = removeSlash(localPath).substring(basePath.length)
    localPathWithoutBase = './'+removeSlash(localPathWithoutBase)
    const url = mergeUrl(localPathWithoutBase, target)
    return  url
  }

  backendToLocalPath(proxyId, backendUrl){
    const { path:basePath, target } = this.configs[proxyId]

    // keep redirect url relative to local server
    const localPath = `${basePath}/${backendUrl.pathname.substring(target.pathname.length)}${backendUrl.search}${backendUrl.hash}`
    return   localPath
  }

  proxy(proxyId, req,res){
    const {path, target, options} = this.configs[proxyId]
    const url = new URL(target)
    if(!req.url.startsWith(path+'/')){
      return
    }
    const targetUrl = this.localToBackendUrl(proxyId, req.originalUrl || req.url)
    proxy.web(req, res, {
      ...urlToHttpOptions(targetUrl),
      ...options,
      onRes: (err, req, proxyRes)=>{
          // rewrite redirect to pass through this proxy
        if(proxyRes.statusCode === 301 || proxyRes.statusCode === 302){
          // handle relative/ absolute location
          const redirectTargetLocation = new URL(proxyRes.headers.location, url)

          // this proxy should only allow communication between known hosts. Don't open it too much
          if(redirectTargetLocation.hostname !== url.hostname || redirectTargetLocation.protocol !== url.protocol){
            throw new Error(`Can't redirect from ${url.hostname} to ${redirectTargetLocation.hostname} `)
          }
          res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'location':  this.backendToLocalPath(proxyId, redirectTargetLocation)});
          res.end()
          return
        }
        // pass through the anwer of the remote server
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers});
        // pass through content
        proxyRes.pipe(res)
      }
    })
  }

  upgrade(proxyId,  req, socket, head){
    const {path, options} = this.configs[proxyId]
    if(!req.url.startsWith(path+'/')){
      return
    }
    const targetUrl = this.localToBackendUrl(proxyId, req.originalUrl || req.url)
    proxy.ws(req, socket, head, {
      ...urlToHttpOptions(targetUrl),
      ...options
    })
  }

  setupOneProxy(proxyId){
    this.httpServer.on('request', (req, res) =>  this.proxy(proxyId, req, res))
    this.httpServer.on('upgrade', (req, socket, head) =>this.upgrade(proxyId, req, socket, head))
  }

}
