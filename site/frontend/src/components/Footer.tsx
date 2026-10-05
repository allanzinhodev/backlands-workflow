import { useLocale } from '../i18n'
import { Icon } from './Icon'

// Public build-time destinations. Unconfigured actions remain visibly unavailable.
function actionUrl(value: string | undefined) {
  const url = value?.trim()
  if (!url) return undefined
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : undefined
  } catch { return undefined }
}

export function Footer() {
  const { copy } = useLocale()
  const actions = [
    { label: copy.footer.download, icon: 'download' as const, url: actionUrl(import.meta.env.VITE_DOWNLOAD_URL), primary: true },
    { label: copy.footer.register, icon: 'user' as const, url: actionUrl(import.meta.env.VITE_REGISTER_URL), primary: false },
  ]
  return (
    <footer className="site-footer">
      <div className="page-shell">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
          <div>
            <a href="#home" className="brand gold-text">{copy.brand}</a>
            <p className="mt-3 max-w-sm text-sm">{copy.footer.tagline}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            {actions.map(action => (
              <div key={action.icon} className="footer-action">
                {action.url ? (
                  <a href={action.url} className={`action-button ${action.primary ? 'action-primary' : ''}`}>
                    <Icon name={action.icon} className="size-4" />{action.label}
                  </a>
                ) : (
                  <button type="button" disabled className={`action-button ${action.primary ? 'action-primary' : ''}`}>
                    <Icon name={action.icon} className="size-4" />{action.label}
                  </button>
                )}
                {!action.url && <span className="soon-label">{copy.footer.soon}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs">
          <p>© {new Date().getFullYear()} {copy.brand}. {copy.footer.copyright}</p>
          <a href="#home" className="back-to-top" aria-label={copy.nav.home}><Icon name="down" className="size-4 rotate-180" /></a>
        </div>
      </div>
    </footer>
  )
}
