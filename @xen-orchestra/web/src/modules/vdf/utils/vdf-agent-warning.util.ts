import { VDF_TIERS } from '@/modules/vdf/types.ts'

// The warnings the agent returns when it checks a document, in its own
// wording (agent/policy.go, ports.go, xapi.go): the ones it is known to
// write, read back so the UI can say them in an admin's words. Any other
// text is shown as is.
export type VdfAgentWarning =
  | { type: 'default-pass-last-tier'; policy: string; tier: number }
  | { type: 'rule-pass-last-tier'; policy: string; rule: number; tier: number }
  | { type: 'default-allow-early'; policy: string; tier: number }
  | { type: 'egress-default-allow-early'; policy: string; tier: number }
  | { type: 'pass-log-ignored'; policy: string; rule: number }
  | { type: 'every-port'; policy: string; rule: number }
  | { type: 'ports-overlap'; policy: string; rule: number; first: string; second: string }
  | { type: 'duplicate-rule-id'; policy: string; rule: number; other: string }
  | { type: 'networks-old-agents' }
  | { type: 'port-ranges-old-agents'; max: number }
  | { type: 'egress-old-agents' }

// a name as Go's %q writes it
const QUOTED = String.raw`"((?:[^"\\]|\\.)*)"`

function unquote(text: string) {
  try {
    return JSON.parse(`"${text}"`) as string
  } catch {
    return text
  }
}

// a tier as the agent names it: its name, or its number
function tier(text: string) {
  return VDF_TIERS.find(({ name }) => name === text)?.value ?? Number(text)
}

const POLICY = String.raw`^policy ${QUOTED}`

const RULE = String.raw`${POLICY} rule (\d+)`

const ENDS_EVALUATION = String.raw`ends evaluation, later tiers \(and their drops\) never see what it allows$`

const SHAPES: [RegExp, (match: RegExpMatchArray) => VdfAgentWarning][] = [
  [
    new RegExp(String.raw`${POLICY}: default pass in the document's last tier \((.+)\) allows$`),
    ([, policy, name]) => ({ type: 'default-pass-last-tier', policy: unquote(policy), tier: tier(name) }),
  ],
  [
    new RegExp(String.raw`${RULE}: pass in the document's last tier \((.+)\) allows$`),
    ([, policy, rule, name]) => ({
      type: 'rule-pass-last-tier',
      policy: unquote(policy),
      rule: Number(rule),
      tier: tier(name),
    }),
  ],
  [
    new RegExp(String.raw`${POLICY}: default allow in tier (\S+) ${ENDS_EVALUATION}`),
    ([, policy, name]) => ({ type: 'default-allow-early', policy: unquote(policy), tier: tier(name) }),
  ],
  [
    new RegExp(String.raw`${POLICY}: egress default allow in tier (\S+) ${ENDS_EVALUATION}`),
    ([, policy, name]) => ({ type: 'egress-default-allow-early', policy: unquote(policy), tier: tier(name) }),
  ],
  [
    new RegExp(String.raw`${RULE}: pass rules decide nothing, log ignored$`),
    ([, policy, rule]) => ({ type: 'pass-log-ignored', policy: unquote(policy), rule: Number(rule) }),
  ],
  [
    new RegExp(String.raw`${RULE}: port range 1-65535 is every port, the same as no ports$`),
    ([, policy, rule]) => ({ type: 'every-port', policy: unquote(policy), rule: Number(rule) }),
  ],
  [
    new RegExp(String.raw`${RULE}: ports (\S+) and (\S+) overlap$`),
    ([, policy, rule, first, second]) => ({
      type: 'ports-overlap',
      policy: unquote(policy),
      rule: Number(rule),
      first,
      second,
    }),
  ],
  [
    new RegExp(String.raw`${RULE}: id already used in policy ${QUOTED}, hits and connections are attributed to both$`),
    ([, policy, rule, other]) => ({
      type: 'duplicate-rule-id',
      policy: unquote(policy),
      rule: Number(rule),
      other: unquote(other),
    }),
  ],
  [/^groups scoped to networks: agents before per-network groups /, () => ({ type: 'networks-old-agents' })],
  [/^egress rules: agents before egress keep enforcing their last policy/, () => ({ type: 'egress-old-agents' })],
  [
    /^port ranges cover more than (\d+) ports in all, too many to list port by port: /,
    ([, max]) => ({ type: 'port-ranges-old-agents', max: Number(max) }),
  ],
]

export function parseAgentWarning(text: string): VdfAgentWarning | undefined {
  for (const [shape, read] of SHAPES) {
    const match = text.match(shape)

    if (match !== null) {
      return read(match)
    }
  }

  return undefined
}
