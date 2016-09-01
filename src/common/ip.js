import forEachRight from 'lodash/forEachRight'
import forEach from 'lodash/forEach'
import isArray from 'lodash/isArray'
import isIp from 'is-ip'
import some from 'lodash/some'
import range from 'ip-range-generator'

export { isIp }
export const isIpV4 = isIp.v4
export const isIpV6 = isIp.v6

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
    splitIp[i] = 1
  })
  if (index === 0 && +splitIp[0] === 255) {
    return 0
  }
  splitIp[index]++

  return splitIp.join('.')
}

export const formatIps = ips => {
  if (!isArray(ips)) {
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
    return splitIp1[3] - splitIp2[3] +
      (splitIp1[2] - splitIp2[2]) * 256 +
      (splitIp1[1] - splitIp2[1]) * 256 * 256 +
      (splitIp1[0] - splitIp2[0]) * 256 * 256 * 256
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
    } else {
      ips.push(...range(ipRange[0], ipRange[1]))
    }
  })

  return ips
}
