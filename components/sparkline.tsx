import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';

export default function Sparkline({ values, width = 160, height = 40, stroke = '#0a7ea4' }: { values: number[]; width?: number; height?: number; stroke?: string }) {
  if (!values || values.length === 0) return <View />
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      <Polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  )
}
