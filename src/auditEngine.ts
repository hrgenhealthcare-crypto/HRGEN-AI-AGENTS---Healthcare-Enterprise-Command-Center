/**
 * Evidence-first universal business audit engine.
 * No web scraping, API connection or financial loss is claimed by this module.
 * Data supplied to it must be collected by authorized adapters or a reviewer.
 */
export const AUDIT_CATEGORIES = {
  google_business: 15,
  website_seo: 15,
  search_competitors: 15,
  lead_conversion: 15,
  social_marketing: 10,
  calling_whatsapp: 10,
  crm_followup: 10,
  trust_reputation: 10,
} as const;
export type AuditCategory = keyof typeof AUDIT_CATEGORIES;
export type AuditObservation = {
  category: AuditCategory;
  finding: string;
  status: 'pass' | 'gap' | 'not_applicable' | 'unverified';
  evidenceUrl?: string;
  observedAt?: string;
  recommendation?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
};
export type AuditInput = {
  businessName: string;
  industry?: string;
  location?: string;
  observations: AuditObservation[];
};
export function evaluateBusinessAudit(input: AuditInput, now = new Date()) {
  if (!input || typeof input.businessName !== 'string' || !input.businessName.trim()) {
    throw new Error('Business name is required');
  }
  if (!Array.isArray(input.observations) || input.observations.length > 300) {
    throw new Error('Observations must be an array of at most 300');
  }
  const findings = input.observations.map((o, index) => {
    if (!o || !Object.prototype.hasOwnProperty.call(AUDIT_CATEGORIES, o.category) || !['pass', 'gap', 'not_applicable', 'unverified'].includes(o.status)) {
      throw new Error('Invalid observation at index ' + index);
    }
    const hasEvidence = !!(o.evidenceUrl && /^https:\/\//i.test(o.evidenceUrl) && o.observedAt && !Number.isNaN(Date.parse(o.observedAt)));
    const verified = hasEvidence && (o.status === 'pass' || o.status === 'gap');
    const status = verified || o.status === 'not_applicable' ? o.status : 'unverified';
    return {
      category: o.category,
      finding: String(o.finding || '').slice(0, 1200),
      status,
      evidenceUrl: hasEvidence ? o.evidenceUrl : null,
      observedAt: hasEvidence ? new Date(o.observedAt!).toISOString() : null,
      severity: status === 'gap' ? (o.severity || 'medium') : null,
      recommendation: status === 'gap' ? String(o.recommendation || 'Manual review and remediation required').slice(0, 1200) : null,
    };
  });
  const categories = Object.entries(AUDIT_CATEGORIES).map(([category, weight]) => {
    const rows = findings.filter(f => f.category === category);
    const applicable = rows.filter(f => f.status !== 'not_applicable');
    const verified = applicable.filter(f => f.status === 'pass' || f.status === 'gap');
    const score = verified.length === 0 ? null : Math.round(100 * verified.filter(f => f.status === 'pass').length / verified.length);
    return { category, weight, score, verifiedChecks: verified.length, missingEvidence: applicable.length - verified.length, notApplicable: rows.length > 0 && rows.every(f => f.status === 'not_applicable') };
  });
  const scored = categories.filter(c => c.score !== null && !c.notApplicable);
  const weightTotal = scored.reduce((s, c) => s + c.weight, 0);
  const score = weightTotal ? Math.round(scored.reduce((s, c) => s + c.weight * (c.score as number), 0) / weightTotal) : null;
  return {
    reportId: 'AUD-' + now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14),
    businessName: input.businessName.trim(),
    industry: input.industry || null,
    location: input.location || null,
    generatedAt: now.toISOString(),
    timezone: 'Asia/Kolkata',
    score,
    scoreDisclosure: 'Weighted score over categories with verified observations only; missing evidence excluded, not treated as success.',
    evidenceCoverage: { verified: findings.filter(f => f.status === 'pass' || f.status === 'gap').length, unverified: findings.filter(f => f.status === 'unverified').length },
    categories,
    findings,
    remedies: findings.filter(f => f.status === 'gap').map(f => ({ category: f.category, priority: f.severity, action: f.recommendation, evidenceUrl: f.evidenceUrl })),
    disclaimer: 'Public-source observations do not prove financial leakage. No actual financial loss, advertising performance, telephony delivery or compliance certification is asserted.',
  };
}
