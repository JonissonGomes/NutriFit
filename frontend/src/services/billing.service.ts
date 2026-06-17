import { api } from './api'

export type PlanKey = 'starter' | 'professional' | 'business'

export const billingService = {
  async getPlanSummary() {
    return api.get('/billing/plan')
  },
  async checkout(plan: PlanKey, successUrl?: string, cancelUrl?: string) {
    const params = new URLSearchParams()
    if (successUrl) params.set('success_url', successUrl)
    if (cancelUrl) params.set('cancel_url', cancelUrl)
    const qs = params.toString()
    return api.post<{ data: { url: string } }>(`/billing/checkout${qs ? `?${qs}` : ''}`, { plan })
  },
  async portal(returnUrl?: string) {
    const qs = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : ''
    return api.post<{ data: { url: string } }>(`/billing/portal${qs}`)
  },
  async exportData() {
    return api.get('/account/data-export')
  },
}
