export const FREE = {
  value: 1,
  name: 'Free',
}
export const STARTER = {
  value: 2,
  name: 'Starter',
}
export const ENTERPRISE = {
  value: 3,
  name: 'Enterprise',
}
export const PREMIUM = {
  value: 4,
  name: 'Premium',
}
export const SOURCES = {
  value: 5,
  name: 'Community',
}
const UNKNOWN = {
  value: 0,
  name: 'Unknown',
}

export const productId2Plan = {
  starter: 2,
  enterprise: 3,
  premium: 4,
  'sb-premium': 4,
}

export const getXoaPlan = (plan = +process.env.XOA_PLAN) => {
  switch (+plan) {
    case 1:
      return FREE
    case 2:
      return STARTER
    case 3:
      return ENTERPRISE
    case 4:
      return PREMIUM
    case 5:
      return SOURCES
    default:
      return UNKNOWN
  }
}

export const CURRENT = getXoaPlan()
