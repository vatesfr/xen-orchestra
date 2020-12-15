import forEachRight from 'lodash/forEachRight'
import forEach from 'lodash/forEach'
import isIp from 'is-ip'
import some from 'lodash/some'

export { isIp }
export const isIpV4 = isIp.v4
export const isIpV6 = isIp.v6

// Source: https://github.com/ezpaarse-project/ip-range-generator/blob/master/index.js

const ipv4 = /^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\.(?!$)|$)){4}$/

function ip2hex(ip) {
  const parts = ip.split('.').map(str => parseInt(str, 10))
  let n = 0

  n += parts[3]
  n += parts[2] * 256 // 2^8
  n += parts[1] * 65536 // 2^16
  n += parts[0] * 16777216 // 2^24

  return n
}

function assertIpv4(str, msg) {
  if (!ipv4.test(str)) {
    throw new Error(msg)
  }
}

function* range(ip1, ip2) {
  assertIpv4(ip1, 'argument "ip1" must be a valid IPv4 address')
  assertIpv4(ip2, 'argument "ip2" must be a valid IPv4 address')

  let hex = ip2hex(ip1)
  let hex2 = ip2hex(ip2)

  if (hex > hex2) {
    const tmp = hex
    hex = hex2
    hex2 = tmp
  }

  for (let i = hex; i <= hex2; i++) {
    yield `${(i >> 24) & 0xff}.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`
  }
}

// -----------------------------------------------------------------------------

export const getNextIpV4 = ip => {
  const splitIp = ip.split('.')
  if (splitIp.length !== 4 || some(splitIp, value => value < 0 || value > 255)) {
    return
  }
  let index
  forEachRight(splitIp, (value, i) => {
    if (value < 255) {
      index = i
      return false
    }
    splitIp[i] = 0
  })
  if (index === 0 && +splitIp[0] === 255) {
    return 0
  }
  splitIp[index]++

  return splitIp.join('.')
}

export const formatIps = ips => {
  if (!Array.isArray(ips)) {
    throw new Error('ips must be an array')
  }
  if (ips.length === 0) {
    return []
  }
  const sortedIps = ips.sort((ip1, ip2) => {
    const splitIp1 = ip1.split('.')
    const splitIp2 = ip2.split('.')
    if (splitIp1.length !== 4) {
      return 1
    }
    if (splitIp2.length !== 4) {
      return -1
    }
    return (
      splitIp1[3] -
      splitIp2[3] +
      (splitIp1[2] - splitIp2[2]) * 256 +
      (splitIp1[1] - splitIp2[1]) * 256 * 256 +
      (splitIp1[0] - splitIp2[0]) * 256 * 256 * 256
    )
  })
  const range = { first: '', last: '' }
  const formattedIps = []
  let index = 0
  forEach(sortedIps, ip => {
    if (ip !== getNextIpV4(range.last)) {
      if (range.first) {
        formattedIps[index] = range.first === range.last ? range.first : { ...range }
        index++
      }
      range.first = range.last = ip
    } else {
      range.last = ip
    }
  })
  formattedIps[index] = range.first === range.last ? range.first : range

  return formattedIps
}

export const parseIpPattern = pattern => {
  const ips = []
  forEach(pattern.split(';'), rawIpRange => {
    const ipRange = rawIpRange.split('-')
    if (ipRange.length < 2) {
      ips.push(ipRange[0])
    } else if (!isIpV4(ipRange[0]) || !isIpV4(ipRange[1])) {
      ips.push(rawIpRange)
    } else {
      ips.push(...range(ipRange[0], ipRange[1]))
    }
  })

  return ips
}
