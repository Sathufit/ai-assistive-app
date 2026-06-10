import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  onCapture: (base64: string) => void;
  onClear?: () => void;
}

const CANVAS_HEIGHT = 220;

const CANVAS_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: white; overflow: hidden; }
  canvas { display: block; touch-action: none; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let debounce = null;

  function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  setup();
  window.addEventListener('resize', setup);

  function pos(e) {
    const t = e.touches ? e.touches[0] : e;
    const r = canvas.getBoundingClientRect();
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      const b64 = canvas.toDataURL('image/png').split(',')[1];
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'capture', data: b64 }));
    }, 1000);
  }, { passive: false });

  window.addEventListener('message', (e) => {
    if (e.data === 'clear') {
      if (debounce) clearTimeout(debounce);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
  document.addEventListener('message', (e) => {
    if (e.data === 'clear') {
      if (debounce) clearTimeout(debounce);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
</script>
</body>
</html>`;

export default function DrawingCanvas({ onCapture, onClear }: Props) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'capture' && msg.data) {
          onCapture(msg.data);
        }
      } catch {}
    },
    [onCapture]
  );

  function handleClear() {
    webViewRef.current?.injectJavaScript("window.dispatchEvent(new MessageEvent('message', { data: 'clear' })); true;");
    if (onClear) onClear();
  }

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

      <WebView
        ref={webViewRef}
        source={{ html: CANVAS_HTML }}
        style={styles.canvas}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled
      />

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
