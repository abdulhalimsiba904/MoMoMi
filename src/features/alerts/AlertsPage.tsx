import type { AppPage } from '../../components/AppShell'
import { Icon } from '../../components/Icon'
import type { MerchantAlert, AlertStatus } from './alertCalculations'
import { getActiveAlerts } from './alertCalculations'
import './Alerts.css'

function categoryLabel(category: MerchantAlert['category']): string {
  return ({
    classification: 'Classification',
    inventory: 'Inventory',
    'transaction-review': 'Transaction review',
    'data-quality': 'Data quality',
    'business-intelligence': 'Business intelligence',
  })[category]
}

function AlertCard({ alert, onNavigate, onStatusChange }: {
  alert: MerchantAlert
  onNavigate: (page: AppPage) => void
  onStatusChange: (id: string, status: AlertStatus) => void
}) {
  return <article className={`alert-card alert-card--${alert.severity} alert-card--${alert.status}`}>
    <div className="alert-card-topline"><span className="alert-category">{categoryLabel(alert.category)}</span><span className={`alert-severity alert-severity--${alert.severity}`}>{alert.severity === 'attention' ? 'Attention' : alert.severity === 'review' ? 'Review' : 'Information'}</span><span className={`alert-state alert-state--${alert.status}`}>{alert.status === 'active' ? 'Active' : alert.status === 'reviewed' ? 'Reviewed · this session' : 'Dismissed · this session'}</span></div>
    <h2>{alert.title}</h2>
    <p className="alert-summary">{alert.summary}</p>
    {alert.evidence.length > 0 && <details className="alert-evidence"><summary>View evidence <span>{alert.evidence.length} {alert.evidence.length === 1 ? 'item' : 'items'}</span></summary><ul>{alert.evidence.map((item, index) => <li key={`${item.sourceRecordId ?? item.label}-${index}`}><span>{item.label}</span><strong>{item.value}</strong></li>)}</ul></details>}
    <div className="alert-card-actions">
      {alert.destination && alert.actionLabel && <button className="alert-primary-action" type="button" onClick={() => onNavigate(alert.destination as AppPage)}>{alert.actionLabel}<Icon name="arrowRight" size={14} /></button>}
      {alert.status === 'active' && <button className="alert-secondary-action" type="button" onClick={() => onStatusChange(alert.id, 'reviewed')}>Mark as reviewed</button>}
      {alert.status !== 'dismissed' && <button className="alert-text-action" type="button" onClick={() => onStatusChange(alert.id, 'dismissed')}>Dismiss</button>}
      {alert.status === 'dismissed' && <button className="alert-secondary-action" type="button" onClick={() => onStatusChange(alert.id, 'active')}>Restore</button>}
    </div>
    {alert.status === 'reviewed' && <p className="alert-acknowledgement">Marked as acknowledged. The underlying record has not changed and may still need classification or confirmation.</p>}
  </article>
}

export function AlertsPage({ alerts, onNavigate, onStatusChange }: {
  alerts: readonly MerchantAlert[]
  onNavigate: (page: AppPage) => void
  onStatusChange: (id: string, status: AlertStatus) => void
}) {
  const activeAlerts = getActiveAlerts(alerts)
  const reviewedAlerts = alerts.filter((alert) => alert.status === 'reviewed')
  const dismissedAlerts = alerts.filter((alert) => alert.status === 'dismissed')

  return <section className="alerts-page" aria-labelledby="alerts-title">
    <header className="alerts-heading"><div><p className="alerts-eyebrow">BUSINESS ACTION CENTER</p><h1 id="alerts-title">Alerts &amp; Action Center</h1><p>Review current items surfaced from your recorded MoMoMI data.</p></div><span className="alerts-demo-label"><span className="demo-dot" />SYNTHETIC DEMO DATA</span></header>
    <section className={`alerts-overview${activeAlerts.length === 0 ? ' alerts-overview--clear' : ''}`} aria-live="polite">
      <span className="alerts-overview-icon"><Icon name={activeAlerts.length === 0 ? 'check' : 'bell'} /></span>
      <div><strong>{activeAlerts.length === 0 ? "You're all caught up." : `${activeAlerts.length} ${activeAlerts.length === 1 ? 'item' : 'items'} to review`}</strong><p>{activeAlerts.length === 0 ? 'No active items currently require review based on your recorded data.' : 'These items may need your review. You remain in control of any changes to your records.'}</p></div>
      <span className="alerts-count-pill">{activeAlerts.length} active</span>
    </section>
    <p className="alerts-source-note"><Icon name="info" size={14} />Alerts are deterministic action items derived from Business Pulse and existing transaction and sale records. They do not change financial data.</p>

    {activeAlerts.length === 0 ? <div className="alerts-empty-state"><span><Icon name="check" size={20} /></span><h2>No active alerts</h2><p>There are no active items requiring review based on the current demo records.</p></div> : <section className="alerts-section" aria-labelledby="active-alerts-heading"><div className="alerts-section-heading"><div><p className="alerts-eyebrow">CURRENT ACTION ITEMS</p><h2 id="active-alerts-heading">Review when ready</h2></div><span>{activeAlerts.length} active</span></div><div className="alerts-list">{activeAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onNavigate={onNavigate} onStatusChange={onStatusChange} />)}</div></section>}

    {reviewedAlerts.length > 0 && <section className="alerts-section alerts-history" aria-labelledby="reviewed-heading"><div className="alerts-section-heading"><div><p className="alerts-eyebrow">SESSION ACKNOWLEDGEMENTS</p><h2 id="reviewed-heading">Reviewed this session</h2></div><span>{reviewedAlerts.length}</span></div><p className="alerts-history-note">Reviewed means acknowledged only. It does not resolve or change the linked record.</p><div className="alerts-list">{reviewedAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onNavigate={onNavigate} onStatusChange={onStatusChange} />)}</div></section>}

    {dismissedAlerts.length > 0 && <section className="alerts-section alerts-history" aria-labelledby="dismissed-heading"><div className="alerts-section-heading"><div><p className="alerts-eyebrow">HIDDEN FOR THIS SESSION</p><h2 id="dismissed-heading">Dismissed items</h2></div><span>{dismissedAlerts.length}</span></div><p className="alerts-history-note">Dismissal hides an item from active review but does not change its underlying record. It can return after refresh.</p><div className="alerts-list">{dismissedAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onNavigate={onNavigate} onStatusChange={onStatusChange} />)}</div></section>}
    <footer className="alerts-footer">Acknowledgement and dismissal are stored in local page state for this prototype and reset on refresh.</footer>
  </section>
}
