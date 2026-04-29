import { useEffect, useRef, type RefObject } from 'react';

/**
 * useParallax — efeitos de parallax em scroll com duas estratégias:
 *
 *  1. CSS scroll-driven animations (Chrome/Edge 115+) via classes
 *     `parallax-*` no theme.css. Detecção via
 *     `CSS.supports('animation-timeline: scroll()')` — quando suportado
 *     o hook NÃO toca em JS, apenas garante a classe no elemento.
 *  2. Fallback JS com IntersectionObserver + requestAnimationFrame, que
 *     escreve CSS variables (`--p-y`, `--p-x`, `--p-rot`, `--p-opacity`)
 *     consumidas pelas mesmas classes utilitárias.
 *
 * Respeita `prefers-reduced-motion: reduce`. Em mobile (<768 px) o caller
 * decide se aplica ou não — este hook não impõe.
 */

export type ParallaxAnchor = 'root' | 'self';

export interface ParallaxOptions {
  /** 'root' = relativo ao scroll do documento; 'self' = à passagem do elemento no viewport. */
  anchor?: ParallaxAnchor;
  /** Multiplicador do scrollY (anchor=root). Ex.: 0.3 para descer 30% do scrollY. */
  speed?: number;
  /** Clamp em px do deslocamento Y (anchor=root). */
  max?: number;
  /** Range total Y em px ao longo da passagem (anchor=self). */
  range?: number;
  /** Offset inicial Y em px (anchor=self). */
  offset?: number;
  /** Deslocamento X total (px) ao longo do progresso. */
  xRange?: number;
  /** Rotação total (deg) ao longo do progresso. */
  rotateRange?: number;
  /** Variação de opacidade (1 → 1 - opacityRange). */
  opacityRange?: number;
  /** Desabilita totalmente o efeito (ex.: viewport mobile). */
  disabled?: boolean;
  /** Aplica o efeito apenas em viewport >= 768 px (decisão do mockup). */
  desktopOnly?: boolean;
}

const supportsScrollTimeline = (): boolean =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()');

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useParallax = <T extends HTMLElement = HTMLElement>(
  options: ParallaxOptions = {},
): RefObject<T> => {
  const ref = useRef<T>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const opts = optsRef.current;
    if (opts.disabled) return;
    if (opts.desktopOnly && !window.matchMedia('(min-width: 768px)').matches) return;
    if (prefersReducedMotion()) return;

    // Caminho A: CSS scroll-driven já cuida — não anima via JS.
    if (supportsScrollTimeline()) return;

    // Caminho B: ativa fallback JS (a flag aciona as regras
    // `html.js-parallax .parallax-*` em theme.css).
    document.documentElement.classList.add('js-parallax');

    let ticking = false;
    let visible = true;

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.target === el) visible = entry.isIntersecting;
        }
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(el);

    const update = () => {
      ticking = false;
      if (!visible) return;

      const anchor = opts.anchor ?? 'root';
      const speed = opts.speed ?? 0.2;
      const maxY = opts.max ?? 9999;
      const range = opts.range ?? 0;
      const offset = opts.offset ?? 0;
      const xRange = opts.xRange ?? 0;
      const rotateRange = opts.rotateRange ?? 0;
      const opacityRange = opts.opacityRange ?? 0;

      let progress: number;
      let y: number;

      if (anchor === 'self') {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = vh + rect.height;
        const traveled = vh - rect.top;
        progress = Math.max(0, Math.min(1, traveled / total));
        y = offset + progress * range;
      } else {
        const scrollY = window.scrollY;
        const rawY = scrollY * speed;
        y = Math.max(-maxY, Math.min(maxY, rawY));
        progress = Math.min(1, scrollY / 500);
      }

      el.style.setProperty('--p-y', `${y.toFixed(1)}px`);
      if (xRange) {
        const x = anchor === 'self' ? xRange / 2 - progress * xRange : progress * xRange;
        el.style.setProperty('--p-x', `${x.toFixed(1)}px`);
      }
      if (rotateRange) {
        el.style.setProperty('--p-rot', `${(progress * rotateRange).toFixed(2)}deg`);
      }
      if (opacityRange) {
        const opacity = 1 - progress * opacityRange;
        el.style.setProperty('--p-opacity', opacity.toFixed(3));
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Cálculo inicial síncrono — evita salto no primeiro paint.
    update();

    const reduceMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onReduceChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        el.style.removeProperty('--p-y');
        el.style.removeProperty('--p-x');
        el.style.removeProperty('--p-rot');
        el.style.removeProperty('--p-opacity');
      }
    };
    reduceMql.addEventListener('change', onReduceChange);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduceMql.removeEventListener('change', onReduceChange);
      io.unobserve(el);
      io.disconnect();
      el.style.removeProperty('--p-y');
      el.style.removeProperty('--p-x');
      el.style.removeProperty('--p-rot');
      el.style.removeProperty('--p-opacity');
    };
    // Intencionalmente sem deps: o hook lê opções via optsRef (mutável)
    // para evitar reanexar listeners de scroll a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
};

export default useParallax;
