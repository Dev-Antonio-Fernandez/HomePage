import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius, spacing } from '../../theme';
import { Text } from './Text';

interface Props {
  latex: string;
}

function buildHtml(latex: string, color: string): string {
  const safe = JSON.stringify(latex);
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<style>
  html,body{margin:0;padding:0;background:transparent;overflow:hidden;}
  #f{color:${color};font-size:24px;padding:8px 2px;text-align:center;}
</style></head><body>
<div id="f"></div>
<script>
  function render(){
    try {
      katex.render(${safe}, document.getElementById('f'),
        {throwOnError:false, displayMode:true});
    } catch(e){ document.getElementById('f').innerText = ${safe}; }
    var h = document.body.scrollHeight;
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(h));
  }
  if (window.katex) render(); else window.addEventListener('load', render);
  setTimeout(render, 400);
</script></body></html>`;
}

// Renderiza una fórmula LaTeX como en un libro/cuaderno (vía KaTeX en WebView).
export function Formula({ latex }: Props) {
  const [height, setHeight] = useState(64);

  if (!latex || latex.trim().length === 0) return null;

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(latex, '#F5F5F7') }}
        style={{ height, backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        scalesPageToFit={false}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!Number.isNaN(h) && h > 0) setHeight(h + 4);
        }}
        // Muestra el LaTeX crudo mientras carga / si no hay internet.
        renderError={() => (
          <View style={styles.fallback}>
            <Text variant="body">{latex}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  fallback: { padding: spacing.md, alignItems: 'center' },
});
