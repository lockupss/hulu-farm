import React, { createContext, useContext, useState, useCallback } from 'react'
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

type ToastType = 'info' | 'success' | 'error'

type Toast = { id: number; message: string; type?: ToastType }

const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const t = { id, message, type }
    setToasts(prev => [...prev, t])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} colors={colors} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, colors }: { toast: Toast; colors: any }) {
  const opacity = new Animated.Value(0)
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start()
    return () => { /* noop */ }
  }, [])
  const background = toast.type === 'error' ? '#FEF2F2' : toast.type === 'success' ? '#ECFDF5' : '#F0F9FF'
  const border = toast.type === 'error' ? '#FCA5A5' : toast.type === 'success' ? '#34D399' : '#60A5FA'
  return (
    <Animated.View style={[styles.toast, { backgroundColor: background, borderColor: border, opacity }]}> 
      <Text style={[styles.toastText, { color: colors.text }]}>{toast.message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, top: 36, alignItems: 'center', zIndex: 9999 },
  toast: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, minWidth: '60%' },
  toastText: { fontSize: 14 }
})

export default ToastProvider
