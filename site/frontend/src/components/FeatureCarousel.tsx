import { useId, useState } from 'react'
import { useLocale } from '../i18n'
import { Icon } from './Icon'
import { Sigil } from './Sigil'

export function FeatureCarousel() {
  const { copy } = useLocale()
  const [index, setIndex] = useState(0)
  const panelId = useId()
  const items = copy.features.items
  const item = items[index % items.length]
  const move = (direction: number) => setIndex(current => (current + direction + items.length) % items.length)
  const position = copy.features.position.replace('{current}', String(index + 1)).replace('{total}', String(items.length))

  return (
    <div className="feature-carousel" role="region" aria-label={copy.features.carousel}>
      <div id={panelId} className="feature-slide" aria-live="polite" aria-atomic="true">
        <span className="feature-number gold-text" aria-hidden="true">{item.number}</span>
        <div className="feature-content">
          <h3 className="feature-title">{item.title}</h3>
          <p className="mt-5 max-w-xl leading-relaxed">{item.description}</p>
        </div>
        <div className="feature-art"><Sigil compact /></div>
      </div>
      <div className="carousel-controls flex items-center justify-between gap-4">
        <span className="carousel-position" aria-live="polite">{position}</span>
        <div className="flex gap-3">
          <button type="button" className="icon-button" aria-controls={panelId} aria-label={copy.features.previous} onClick={() => move(-1)}><Icon name="arrow" className="size-5 rotate-180" /></button>
          <button type="button" className="icon-button" aria-controls={panelId} aria-label={copy.features.next} onClick={() => move(1)}><Icon name="arrow" className="size-5" /></button>
        </div>
      </div>
    </div>
  )
}
