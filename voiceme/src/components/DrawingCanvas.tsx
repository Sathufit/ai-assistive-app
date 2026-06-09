import React, { useRef, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useCanvasRef,
  ImageFormat,
  SkPath,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface Props {
  onCapture: (base64: string) => void;
  onClear?: () => void;
}

const CANVAS_HEIGHT = 220;

export default function DrawingCanvas({ onCapture, onClear }: Props) {
  const canvasRef = useCanvasRef();
  const [paths, setPaths] = useState<SkPath[]>([]);
  const currentPathRef = useRef<SkPath | null>(null);
  const [, forceUpdate] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCapture = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const image = canvasRef.current?.makeImageSnapshot();
      if (image) {
        const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
        if (base64) {
          onCapture(base64);
        }
      }
    }, 1000);
  }, [canvasRef, onCapture]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      const newPath = Skia.Path.Make();
      newPath.moveTo(e.x, e.y);
      currentPathRef.current = newPath;
      forceUpdate((n) => n + 1);
    })
    .onUpdate((e) => {
      if (currentPathRef.current) {
        currentPathRef.current.lineTo(e.x, e.y);
        forceUpdate((n) => n + 1);
      }
    })
    .onEnd(() => {
      if (currentPathRef.current) {
        setPaths((prev) => [...prev, currentPathRef.current!]);
        currentPathRef.current = null;
        triggerCapture();
      }
    });

  function handleClear() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setPaths([]);
    currentPathRef.current = null;
    forceUpdate((n) => n + 1);
    if (onClear) onClear();
  }

  const paint = {
    color: 'black' as const,
    strokeWidth: 4,
    style: 'stroke' as const,
    strokeCap: 'round' as const,
    strokeJoin: 'round' as const,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Draw here</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Clear drawing canvas"
        >
          <Text style={styles.clearText}>CLR</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={panGesture}>
        <Canvas ref={canvasRef} style={styles.canvas}>
          {/* White background */}
          <Path
            path={`M 0 0 L 1000 0 L 1000 ${CANVAS_HEIGHT} L 0 ${CANVAS_HEIGHT} Z`}
            color="white"
            style="fill"
          />

          {/* Completed paths */}
          {paths.map((p, idx) => (
            <Path
              key={idx}
              path={p}
              color={paint.color}
              strokeWidth={paint.strokeWidth}
              style={paint.style}
              strokeCap={paint.strokeCap}
              strokeJoin={paint.strokeJoin}
            />
          ))}

          {/* Current in-progress path */}
          {currentPathRef.current && (
            <Path
              path={currentPathRef.current}
              color={paint.color}
              strokeWidth={paint.strokeWidth}
              style={paint.style}
              strokeCap={paint.strokeCap}
              strokeJoin={paint.strokeJoin}
            />
          )}
        </Canvas>
      </GestureDetector>

      <Text style={styles.hint}>Draw text with your finger or stylus</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#90CAF9',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
  },
  clearButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 40,
    justifyContent: 'center',
  },
  clearText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  canvas: {
    width: '100%',
    height: CANVAS_HEIGHT,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
  },
});
