import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { UniverseScene, type UniverseProps } from './UniverseScene';

/** Native-only surface. Core RN responders own gestures, not a browser controls package. */
export default function UniverseCanvas(props: UniverseProps) {
  const bounds = useRef({ width: 1, height: 1 });
  const controls = props.controls;
  const responder = useMemo(() => {
    const sample = (event: GestureResponderEvent) => controls.sample(
      event.nativeEvent.touches.map((touch) => ({ id: touch.identifier, x: touch.pageX, y: touch.pageY })),
      bounds.current.width, bounds.current.height,
    );
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: sample,
      onPanResponderMove: sample,
      onPanResponderStart: sample,
      onPanResponderEnd: (event) => { if (event.nativeEvent.touches.length) sample(event); },
      onPanResponderRelease: () => controls.release(),
      onPanResponderTerminate: () => controls.cancel(),
      onPanResponderTerminationRequest: () => true,
    });
  }, [controls]);
  return (
    <View style={styles.fill} onLayout={(event) => { bounds.current = event.nativeEvent.layout; }}>
      <View style={styles.fill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Canvas camera={{ position: [0, 1.25, 10.4], fov: 50, near: 0.1, far: 220 }} gl={{ antialias: false, alpha: false }} frameloop={props.active ? 'always' : 'never'}>
          <UniverseScene {...props} />
        </Canvas>
      </View>
      <View style={styles.fill} {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Your universe" accessibilityHint="Drag to orbit the star. Pinch to zoom." accessibilityActions={[{ name: 'increment', label: 'Zoom in' }, { name: 'decrement', label: 'Zoom out' }]} onAccessibilityAction={(event) => controls.zoom(event.nativeEvent.actionName === 'increment' ? 0.85 : 1.15)} />
    </View>
  );
}
const styles = StyleSheet.create({ fill: { position: 'absolute', inset: 0 } });
