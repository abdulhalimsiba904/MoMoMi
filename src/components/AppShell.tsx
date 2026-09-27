import type { ReactNode } from 'react'
import { dashboardDemo } from '../data/dashboardDemo'
import { Icon, type IconName } from './Icon'
import '../features/dashboard/Dashboard.css'

export type AppPage = 'dashboard' | 'money-in' | 'money-out' | 'inventory' | 'analytics' | 'copilot' | 'alerts'

const navItems: { label: string; icon: IconName; page?: AppPage }[] = [
  { label: 'Dashboard', icon: 'grid', page: 'dashboard' },
  { label: 'Money In', icon: 'arrow-down', page: 'money-in' },
  { label: 'Money Out', icon: 'arrow-up', page: 'money-out' },
  { label: 'Inventory', icon: 'layers', page: 'inventory' },
  { label: 'Analytics', icon: 'chart', page: 'analytics' },
  { label: 'Alerts', icon: 'bell', page: 'alerts' },
  { label: 'Business Copilot', icon: 'spark', page: 'copilot' },
]

function LogoMark() {
  return <span className="logo-mark" aria-hidden="true"><span>M</span><i /></span>
}

function Sidebar({ activePage, onNavigate }: { activePage: AppPage; onNavigate: (page: AppPage) => void }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <a className="brand" href="#dashboard" aria-label="MoMoMI dashboard">
        <LogoMark />
        <span className="brand-copy"><strong>MoMoMI</strong><small>MERCHANT INTELLIGENCE</small></span>
      </a>
      <div className="sidebar-label">WORKSPACE</div>
      <nav>
        <ul className="nav-list">
          {navItems.map((item) => {
            const active = item.page === activePage
            return <li key={item.label}>
              <button className={`nav-item${active ? ' is-active' : ''}`} type="button" aria-label={item.label} aria-current={active ? 'page' : undefined} aria-disabled={!item.page} title={item.label} onClick={() => item.page && onNavigate(item.page)}>
                <Icon name={item.icon} /><span>{item.label}</span>
                {!item.page && <span className="nav-soon">Soon</span>}
              </button>
            </li>
          })}
        </ul>
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-sidebar-note"><span className="demo-dot" /><span>Prototype preview<small>Synthetic demo data</small></span></div>
        <div className="sidebar-footer">Built for small business clarity</div>
      </div>
    </aside>
  )
}

function MobileNavigation({ activePage, onNavigate }: { activePage: AppPage; onNavigate: (page: AppPage) => void }) {
  return <nav className="mobile-navigation" aria-label="Main navigation">
    {navItems.map((item) => {
      const active = item.page === activePage
      return <button className={`mobile-nav-item${active ? ' is-active' : ''}`} type="button" key={item.label} aria-label={item.label} title={item.label} aria-current={active ? 'page' : undefined} aria-disabled={!item.page} onClick={() => item.page && onNavigate(item.page)}>
        <Icon name={item.icon} size={15} /><span>{item.label}</span>
      </button>
    })}
  </nav>
}

function Header() {
  return (
    <header className="topbar">
      <div className="topbar-mobile-brand"><LogoMark /><strong>MoMoMI</strong></div>
      <div className="demo-label"><span className="demo-dot" />DEMO ENVIRONMENT</div>
      <button className="merchant-profile" type="button" aria-label={`${dashboardDemo.merchant.ownerName}, merchant profile`}>
        <span className="avatar">A</span>
        <span className="profile-copy"><strong>{dashboardDemo.merchant.businessName}</strong><small>Merchant account</small></span>
        <span className="profile-chevron"><Icon name="chevron" size={16} /></span>
      </button>
    </header>
  )
}

export function AppShell({ activePage, onNavigate, children }: { activePage: AppPage; onNavigate: (page: AppPage) => void; children: ReactNode }) {
  return <div className="app-layout" id="dashboard">
    <Sidebar activePage={activePage} onNavigate={onNavigate} />
    <div className="main-column">
      <Header />
      <main className="dashboard-main">
        <MobileNavigation activePage={activePage} onNavigate={onNavigate} />
        {children}
      </main>
    </div>
  </div>
}

export { LogoMark }
