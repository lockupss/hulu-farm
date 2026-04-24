import React from 'react';
import { StyleSheet, View } from 'react-native';

const Card = ({ children, style, variant }: { children: React.ReactNode; style?: any; variant?: 'default' | 'alert' | 'info' }) => {
  const variantStyle = variant === 'alert' ? styles.alert : variant === 'info' ? styles.info : null
  return <View style={[styles.card, variantStyle, style]}>{children}</View>
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  alert: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFF7ED'
  },
  info: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF'
  }
})

export default Card
