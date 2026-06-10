import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface Props {
  onCapture: (base64: string) => void;
  onClear?: () => void;
}

const CANVAS_HEIGHT = 290;

const CANVAS_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #FFFFFF; overflow: hidden; }
  canvas { display: block; touch-action: none; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let debounce = null;

  function drawGuides() {
    ctx.save();
    ctx.strokeStyle = '#EEF2FF';
    ctx.lineWidth = 1;
    for (let y = 68; y < canvas.height - 16; y += 68) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawGuides();
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
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!drawing) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    drawing = false;
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
      drawGuides();
    }
  });
  document.addEventListener('message', (e) => {
    if (e.data === 'clear') {
      if (debounce) clearTimeout(debounce);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGuides();
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
    webViewRef.current?.injectJavaScript(
      "window.dispatchEvent(new MessageEvent('message', { data: 'clear' })); true;"
    );
    if (onClear) onClear();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="create-outline" size={17} color="#475569" />
          <Text style={styles.headerText}>Handwriting</Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Clear drawing canvas"
        >
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
          <Text style={styles.clearText}>Clear</Text>
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

      <View style={styles.footer}>
        <Ionicons name="pencil-outline" size={13} color="#94A3B8" />
        <Text style={styles.hint}>Write with finger or S Pen · auto-recognizes after 1 s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    letterSpacing: 0.2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    justifyContent: 'center',
  },
  clearText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  canvas: {
    width: '100%',
    height: CANVAS_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
});
