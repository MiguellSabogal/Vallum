'use client';
import { useEffect } from 'react';

// Replica el comportamiento del IntersectionObserver de la version vanilla:
// agrega .fade-up a las cards, y al entrar en viewport agrega .visible y
// anima las barras de stats (.stat-bar-fill) hasta su data-width.
// `dep` permite reejecutar el efecto cuando las product-card ya se renderizaron.
export function useScrollReveal(dep) {
  useEffect(() => {
    const els = document.querySelectorAll('.calidad-card, .product-card, .review-card');
    els.forEach((el) => el.classList.add('fade-up'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          e.target.querySelectorAll('.stat-bar-fill').forEach((bar) => {
            bar.style.width = bar.dataset.width + '%';
          });
        }
      });
    }, { threshold: 0.1 });

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}
