import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ProductScene, type ProductSceneProps } from './ProductScene';
import type { TouchPoint } from '../universe/camera';

/** Browser adapter; the scene and camera controller stay shared with iPhone. */
export default function ProductCanvas(props: ProductSceneProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const host = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, TouchPoint>());
  const controls = props.controls;
  useEffect(() => {
    setMounted(true);
    const visibility = () => { setVisible(!document.hidden); controls.cancel(); pointers.current.clear(); };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [controls]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {if(props.focus)return; event.preventDefault(); controls.zoom(Math.exp(Math.max(-100, Math.min(100, event.deltaY)) * 0.003)); };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [controls,props.focus]);
  const sample = () => {
    const rect = host.current?.getBoundingClientRect();
    if (rect) controls.sample([...pointers.current.values()], rect.width, rect.height);
  };
  return (
    <div ref={host} style={{ position: 'absolute', inset: 0, touchAction: 'none', outline: 'none' }} tabIndex={props.focus?-1:0} aria-hidden={!!props.focus} role="group" aria-label="Your universe. Drag to orbit, pinch or scroll to zoom. Arrow keys orbit; plus and minus zoom."
      onPointerDown={(event) => { if(props.focus)return; event.currentTarget.setPointerCapture(event.pointerId); pointers.current.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY }); sample(); }}
      onPointerMove={(event) => { if (pointers.current.has(event.pointerId)) { pointers.current.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY }); sample(); } }}
      onPointerUp={(event) => { pointers.current.delete(event.pointerId); if (pointers.current.size) sample(); else controls.release(); }}
      onPointerCancel={() => { pointers.current.clear(); controls.cancel(); }}
      onLostPointerCapture={(event) => { if (pointers.current.has(event.pointerId)) { pointers.current.clear(); controls.cancel(); } }}
      onKeyDown={(event) => {
        if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); controls.zoom(event.key === '-' ? 1.12 : 0.88); }
        const offset = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }[event.key];
        if (offset) { event.preventDefault(); controls.sample([{ id: 0, x: 0, y: 0 }], 400, 800); controls.sample([{ id: 0, x: offset[0], y: offset[1] }], 400, 800); controls.cancel(); }
      }}>
      {mounted && <Canvas style={{ pointerEvents: 'none' }} camera={{ position: [0, 0, 12.2], fov: 48, near: 0.1, far: 220 }} gl={{ antialias: false, alpha: false }} dpr={[1, 1.5]} frameloop={props.active && visible ? 'always' : 'never'}><ProductScene {...props} /></Canvas>}
    </div>
  );
}
