import React from 'react'
import { TextInput, StyleSheet } from 'react-native'

export const Input = (props: any) => {
  return <TextInput style={[styles.input, props.style]} placeholderTextColor="#9ca3af" {...props} />
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff'
  }
})

export default Input
