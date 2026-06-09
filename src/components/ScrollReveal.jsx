'use client';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

// Dispara las animaciones de aparición al hacer scroll (efecto cliente).
export default function ScrollReveal({ dep }) {
  useScrollReveal(dep);
  return null;
}
