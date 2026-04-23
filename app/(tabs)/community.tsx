import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import forumData from '../../data/forum.json'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

function DiscussionItem({ item }: { item: any }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={styles.avatar}><Text>💬</Text></View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.category}><Text style={styles.categoryText}>{item.category}</Text></View>
          </View>
          <Text style={styles.meta}>{item.author} • {item.time}</Text>
          <Text style={styles.body}>{item.content}</Text>
          <View style={styles.actionsRow}>
            <Text style={styles.action}>💬 {item.replies} replies</Text>
            <Text style={styles.action}>👍 {item.likes} likes</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function Community() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
  <Text style={[styles.headerTitle, { color: colors.text }]}>Community Forum</Text>
  <Text style={[styles.headerSubtitle, { color: muted }]}>Connect with farmers and share experiences</Text>
      </View>

      <Card style={{ marginHorizontal: 16 }}>
        <Input placeholder="What's on your mind?" />
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Button style={{ flex: 1, marginRight: 8 }}>
            Post Discussion
          </Button>
          <Button variant="outline" style={{ flex: 1 }}>
            Ask a Question
          </Button>
        </View>
      </Card>

      <FlatList
        data={forumData}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <Card style={{ marginHorizontal: 16 }}>
            <DiscussionItem item={item} />
          </Card>
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  category: { backgroundColor: '#F0F7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 12, color: '#0366d6' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  body: { marginTop: 8, fontSize: 14, color: '#374151' },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  action: { fontSize: 12, color: '#6b7280', marginRight: 16 }
})
