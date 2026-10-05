export function Sigil({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? 'sigil sigil-compact' : 'sigil'} viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <circle cx="200" cy="200" r="156" />
      <circle cx="200" cy="200" r="143" strokeDasharray="1 13" />
      <circle cx="200" cy="200" r="116" />
      <path d="M200 20v78m0 204v78M20 200h78m204 0h78M72 72l55 55m146 146 55 55M72 328l55-55m146-146 55-55" />
      <path d="m200 78 33 89 89 33-89 33-33 89-33-89-89-33 89-33 33-89Z" />
      <path d="m200 128 21 51 51 21-51 21-21 51-21-51-51-21 51-21 21-51Z" />
      <path d="M200 78v244M78 200h244" opacity=".5" />
      <circle cx="200" cy="200" r="7" className="sigil-center" />
      <path d="m200 12 5 8-5 8-5-8 5-8Zm0 360 5 8-5 8-5-8 5-8ZM12 200l8-5 8 5-8 5-8-5Zm360 0 8-5 8 5-8 5-8-5Z" />
    </svg>
  )
}
