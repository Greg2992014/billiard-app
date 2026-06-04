/**
 * Maps semantic icon names to their SVG file paths in public/images/other/.
 */
const ICON_SRC: Record<string, string> = {
  info:     '/images/other/info.svg',
  award:    '/images/other/award.svg',
  fail:     '/images/other/fail.svg',
  fool:     '/images/other/fool.svg',
  loading:  '/images/other/loading.svg',
  not_found:'/images/other/not_found.svg',
  back:     '/images/other/back.svg',
  repeat:   '/images/other/repeat.svg',
  clock:    '/images/other/clock.svg',
  clock_v2: '/images/other/clock_v2.svg',
  cancel:   '/images/other/cancel.svg',
  history:  '/images/other/history.svg',
  exit:     '/images/other/exit.svg',
  start:    '/images/other/start.svg',
  create:   '/images/other/create.svg',
  piramid:  '/images/other/piramid.svg',
  sections: '/images/other/sections.svg',
  correct:  '/images/other/correct.svg',
  wrong:    '/images/other/wrong.svg',
  money:    '/images/other/money.svg',
  pool_mode:'/images/other/pool_mode.svg',
};

export type IconName = keyof typeof ICON_SRC;

interface IconImageProps {
  name: IconName;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Renders a decorative SVG icon from public/images/other/.
 *
 * Usage:
 *   <IconImage name="fool" size={20} />
 *   <IconImage name="award" size={32} />
 */
export function IconImage({ name, size = 20, className = '', alt }: IconImageProps) {
  const src = ICON_SRC[name];

  if (!src) {
    return (
      <span
        className={`inline-block align-middle rounded bg-white/10 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      className={`inline-block align-middle select-none ${className}`}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  );
}
