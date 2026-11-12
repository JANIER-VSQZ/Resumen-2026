import { useLayoutEffect, useRef } from 'react';

export default function useCardEntrance(contentVersion) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = [...container.querySelectorAll('.project-info, .gallery-img, .gallery-empty')];
    const groupOrder = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || target.dataset.cardEntrance !== 'pending') return;
        target.dataset.cardEntrance = 'visible';
        observer.unobserve(target);
      });
    }, { threshold: .01, rootMargin: '0px 0px -12px 0px' });

    const finishEntrance = card => {
      delete card.dataset.cardEntrance;
      card.style.removeProperty('--card-entrance-order');
      observer.unobserve(card);
    };
    const onAnimationEnd = event => {
      if (event.animationName === 'detail-card-enter') finishEntrance(event.target);
    };
    const onFocus = event => {
      const card = event.target.closest('[data-card-entrance]');
      if (card) finishEntrance(card);
    };
    container.addEventListener('animationend', onAnimationEnd);
    container.addEventListener('focusin', onFocus);

    cards.forEach(card => {
      if (card.contains(document.activeElement)) return;
      const order = groupOrder.get(card.parentElement) || 0;
      groupOrder.set(card.parentElement, order + 1);
      card.style.setProperty('--card-entrance-order', String(Math.min(order, 5)));
      card.dataset.cardEntrance = 'pending';
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
      container.removeEventListener('animationend', onAnimationEnd);
      container.removeEventListener('focusin', onFocus);
      cards.forEach(finishEntrance);
    };
  }, [contentVersion]);

  return containerRef;
}
