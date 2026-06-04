import { COLOR_NAMES_RU } from '@/lib/constants';

/**
 * Maps ball color names and group types to their SVG file paths.
 * Centralized here so all UI components share the same image source.
 */
const BALL_IMAGE_SRC: Record<string, string> = {
  red:    '/images/balls/red_ball.svg',
  yellow: '/images/balls/yellow_ball.svg',
  green:  '/images/balls/green_ball.svg',
  brown:  '/images/balls/brown_ball.svg',
  blue:   '/images/balls/blue_ball.svg',
  pink:   '/images/balls/pink_ball.svg',
  black:  '/images/balls/black_ball.svg',
  white:  '/images/balls/white_ball.svg',
  solid:  '/images/balls/solid_ball.svg',
  stripe: '/images/balls/stripe_ball.svg',
};

interface BallImageProps {
  /** Ball color name (red, yellow, green, brown, blue, pink, black, white) or group type (solid, stripe) */
  color: string;
  /** Width & height in pixels. Defaults to 20. Use 16–18 for inline text, 22–24 for standalone buttons. */
  size?: number;
  /** Extra CSS classes */
  className?: string;
}

/**
 * Renders a billiard ball SVG image for the given color.
 *
 * Usage:
 *   <BallImage color="red" size={20} />
 *   <BallImage color="solid" size={24} />
 *
 * Falls back to a styled placeholder if the color is not recognized.
 */
export function BallImage({ color, size = 20, className = '' }: BallImageProps) {
  const src = BALL_IMAGE_SRC[color];
  const alt = COLOR_NAMES_RU[color] ?? color;

  if (!src) {
    return (
      <span
        className={`inline-block align-middle rounded-full bg-white/10 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block align-middle select-none ${className}`}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  );
}
