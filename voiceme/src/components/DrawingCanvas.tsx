import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface Props {
  onCapture: (base64: string) => void;
  onClear?: () => void;
}

const CANVAS_HEIGHT = 290;
// Sinhala letters need several strokes — wait long enough that a pause
// between strokes doesn't trigger recognition mid-word
const AUTO_CAPTURE_DELAY_MS = 2200;

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
  let hasNewInk = false;

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

  function paintBackground() {
    // A real white background is required: transparent pixels confuse
    // the OCR model and break JPEG export
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGuides();
  }

  function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    paintBackground();
  }
  setup();
  window.addEventListener('resize', setup);

  function capture() {
    if (debounce) clearTimeout(debounce);
    debounce = null;
    if (!hasNewInk) return;
    hasNewInk = false;
    const b64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'capture', data: b64 }));
  }

  function pos(e) {
    const t = e.touches ? e.touches[0] : e;
    const r = canvas.getBoundingClientRect();
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (debounce) clearTimeout(debounce);
    drawing = true;
    const p = pos(e);
    ctx.strokeStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!drawing) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasNewInk = true;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    drawing = false;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(capture, ${AUTO_CAPTURE_DELAY_MS});
  }, { passive: false });

  function handleCommand(data) {
    if (data === 'clear') {
      if (debounce) clearTimeout(debounce);
      debounce = null;
      hasNewInk = false;
      paintBackground();
    } else if (data === 'capture-now') {
      capture();
    }
  }
  window.addEventListener('message', (e) => handleCommand(e.data));
  document.addEventListener('message', (e) => handleCommand(e.data));
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

  function sendCommand(command: 'clear' | 'capture-now') {
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: '${command}' })); true;`
    );
  }

  function handleClear() {
    sendCommand('clear');
    if (onClear) onClear();
  }

  function handleReadNow() {
    sendCommand('capture-now');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="create-outline" size={17} color="#475569" />
          <Text style={styles.headerText}>Handwriting</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.readButton}
            onPress={handleReadNow}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Recognize handwriting now"
          >
            <Ionicons name="scan-outline" size={15} color="#2563EB" />
            <Text style={styles.readText}>Read</Text>
          </TouchableOpacity>
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
        <Text style={styles.hint}>
          Write with finger or S Pen · reads automatically, or tap Read
        </Text>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    justifyContent: 'center',
  },
  readText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
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
