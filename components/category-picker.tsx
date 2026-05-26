import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/lib/i18n';
import { translateCategory } from '@/lib/translate-data';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CategoryPicker({ category, setCategory, options }: { category: string; setCategory: (c: string) => void; options?: string[] }) {
  const [open, setOpen] = useState(false)
  const defaultOptions = ['General', 'Diesease management', 'weather', 'market trend']
  const opts = options && options.length ? options : defaultOptions
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()

  return (
    <View style={{ position: 'relative', zIndex: 100 }}>
      <TouchableOpacity style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => setOpen(!open)}>
        <Text style={{ color: colors.text }}>{translateCategory(category, t)} ▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {opts.map(o => (
            <TouchableOpacity key={o} onPress={() => { setCategory(o); setOpen(false) }} style={styles.option}>
              <Text style={{ color: o === category ? colors.tint : colors.text, fontWeight: o === category ? '700' : '400' }}>{translateCategory(o, t)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    zIndex: 150,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  option: { paddingVertical: 6, paddingHorizontal: 8 }
})
