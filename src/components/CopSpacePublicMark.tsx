'use client'

export function CopSpacePublicMark({
  variant = 'light',
  size = 'md',
}: {
  variant?: 'light' | 'onDark'
  size?: 'sm' | 'md' | 'lg'
}) {
  const height = size === 'lg' ? 'h-24 md:h-28' : size === 'sm' ? 'h-14' : 'h-20 md:h-24'
  const wrap =
    variant === 'onDark'
      ? 'inline-flex rounded-2xl bg-white px-4 py-3 shadow-lg'
      : 'inline-flex'

  return (
    <div className={wrap}>
      <img
        src="/cop-space-logo.jpg"
        alt="COP Space — Centre d’Orientation Professionnelle"
        className={`${height} w-auto object-contain`}
      />
    </div>
  )
}
