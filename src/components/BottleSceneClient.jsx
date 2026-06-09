'use client';
import dynamic from 'next/dynamic';

// La escena 3D usa WebGL/window: se carga solo en el cliente (sin SSR).
const BottleScene = dynamic(() => import('./BottleScene.jsx'), { ssr: false });

export default function BottleSceneClient() {
  return <BottleScene />;
}
