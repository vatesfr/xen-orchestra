import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import type { IconName } from '@core/icons'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute } from 'vue-router'

export type VdfFirewallPage = {
  to: RouteLocationRaw
  label: string
  icon: IconName
  // the route names it covers: its own, and the pages under it (the
  // monitor mode report, under Policies)
  names: string[]
}

export type VdfFirewallSection = {
  label: string
  pages: VdfFirewallPage[]
}

// The Firewall's pages, as vSphere's Configure lists its own: what the
// hosts do (status), then what they are told (configuration). Traces, the
// live view and settings are a pool's: the global configuration is
// enforced there. Trace is a tool, in its drawer, not a page.
export function useVdfFirewallPages(rawScope: MaybeRefOrGetter<VdfScope>) {
  const { t } = useI18n()

  const route = useRoute()

  const sections = computed<VdfFirewallSection[]>(() => {
    const scope = toValue(rawScope)

    if (scope.kind === 'global') {
      return [
        {
          label: t('firewall:nav:status'),
          pages: [
            {
              to: { name: '/(site)/firewall/overview' },
              label: t('firewall:overview'),
              icon: 'fa:shield',
              names: ['/(site)/firewall/overview'],
            },
          ],
        },
        {
          label: t('firewall:nav:configuration'),
          pages: [
            {
              to: { name: '/(site)/firewall/policies' },
              label: t('firewall:policies'),
              icon: 'fa:list',
              names: ['/(site)/firewall/policies'],
            },
            {
              to: { name: '/(site)/firewall/groups' },
              label: t('firewall:groups'),
              icon: 'fa:object-group',
              names: ['/(site)/firewall/groups'],
            },
            {
              to: { name: '/(site)/firewall/history' },
              label: t('firewall:history'),
              icon: 'fa:clock',
              names: ['/(site)/firewall/history'],
            },
          ],
        },
      ]
    }

    const params = { id: scope.pool.id }

    return [
      {
        label: t('firewall:nav:status'),
        pages: [
          {
            to: { name: '/pool/[id]/firewall/overview', params },
            label: t('firewall:overview'),
            icon: 'fa:shield',
            names: ['/pool/[id]/firewall/overview'],
          },
          {
            to: { name: '/pool/[id]/firewall/traffic', params },
            label: t('firewall:traffic'),
            icon: 'fa:network-wired',
            names: ['/pool/[id]/firewall/traffic'],
          },
          {
            to: { name: '/pool/[id]/firewall/rule-log', params },
            label: t('firewall:logs'),
            icon: 'fa:align-left',
            names: ['/pool/[id]/firewall/rule-log'],
          },
        ],
      },
      {
        label: t('firewall:nav:configuration'),
        pages: [
          {
            to: { name: '/pool/[id]/firewall/policies', params },
            label: t('firewall:policies'),
            icon: 'fa:list',
            names: ['/pool/[id]/firewall/policies', '/pool/[id]/firewall/monitor'],
          },
          {
            to: { name: '/pool/[id]/firewall/groups', params },
            label: t('firewall:groups'),
            icon: 'fa:object-group',
            names: ['/pool/[id]/firewall/groups'],
          },
          {
            to: { name: '/pool/[id]/firewall/settings', params },
            label: t('firewall:settings'),
            icon: 'fa:sliders',
            names: ['/pool/[id]/firewall/settings'],
          },
          {
            to: { name: '/pool/[id]/firewall/history', params },
            label: t('firewall:history'),
            icon: 'fa:clock',
            names: ['/pool/[id]/firewall/history'],
          },
        ],
      },
    ]
  })

  // the page shown, for the header's title
  const currentPage = computed(() =>
    sections.value.flatMap(section => section.pages).find(page => page.names.includes(String(route.name)))
  )

  return { sections, currentPage }
}
