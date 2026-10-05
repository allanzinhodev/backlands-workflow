import { useLocale } from '../i18n'

export function LaunchProgress() {
  const { copy } = useLocale()
  return (
    <div className="launch-progress">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="eyebrow">{copy.progress.label}</span>
        <span className="status-tag"><span className="status-dot" aria-hidden="true" />{copy.progress.current}</span>
      </div>
      <div role="progressbar" aria-label={copy.progress.label} aria-valuemin={0} aria-valuemax={4} aria-valuenow={0} aria-valuetext={copy.progress.current} className="progress-track">
        <span className="progress-start" />
      </div>
      <ol className="progress-stages mt-4 grid grid-cols-4">
        {copy.progress.stages.map(stage => <li key={stage}>{stage}</li>)}
      </ol>
    </div>
  )
}
