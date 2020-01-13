const FREE = {
  valueOf: () => 1,
  name: 'Free',
}
const STARTER = {
  valueOf: () => 2,
  name: 'Starter',
}
export const ENTERPRISE = {
  valueOf: () => 3,
  name: 'Enterprise',
}
export const PREMIUM = {
  valueOf: () => 4,
  name: 'Premium',
}
export const SOURCES = {
  valueOf: () => 5,
  name: 'Community',
}

export const getXoaPlan = (plan = +process.env.XOA_PLAN) => {
  switch (plan) {
    case +FREE:
      return FREE
    case +STARTER:
      return STARTER
    case +ENTERPRISE:
      return ENTERPRISE
    case +PREMIUM:
      return PREMIUM
    case +SOURCES:
      return SOURCES
  }
  return { name: 'Unknown' }
}

export const CURRENT = getXoaPlan()

export const idToPlan = id => {
  switch (id) {
    case 'free':
      return FREE
    case 'starter':
      return STARTER
    case 'enterprise':
      return ENTERPRISE
    case 'premium':
      return PREMIUM
    case 'sb-premium':
      return PREMIUM
  }
}
