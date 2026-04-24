import React, { useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function CategoryPicker({ category, setCategory, options }: { category: string; setCategory: (c: string) => void; options?: string[] }) {
  const [open, setOpen] = useState(false)
  const defaultOptions = ['General', 'Disease Management', 'Market Trends', 'Weather Preparation']
  const opts = options && options.length ? options : defaultOptions
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity style={[styles.button, { borderColor: '#E5E7EB', backgroundColor: colors.background }]} onPress={() => setOpen(!open)}>
        <Text style={{ color: colors.text }}>{category} ▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.menu, { backgroundColor: colors.background, borderColor: '#E5E7EB' }]}> 
          {opts.map(o => (
            <TouchableOpacity key={o} onPress={() => { setCategory(o); setOpen(false) }} style={styles.option}>
              <Text style={{ color: o === category ? colors.tint : colors.text, fontWeight: o === category ? '700' : '400' }}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  menu: { position: 'absolute', top: 44, right: 0, borderWidth: 1, borderRadius: 8, padding: 6, zIndex: 20, minWidth: 180 },
  option: { paddingVertical: 6, paddingHorizontal: 8 }
})
