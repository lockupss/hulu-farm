import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from '@/lib/i18n'
import { getJSON } from '@/lib/api'
import { loadItem } from '@/lib/storage'
import forumData from '../data/forum.json'

function normalizePost(p: any) {
  const post = { ...p }
  if (!post.replies || Array.isArray(post.replies) === false) post.replies = []
  post.likes = typeof post.likes === 'number' ? post.likes : (Array.isArray(post.liked_by) ? post.liked_by.length : (post.likes ? Number(post.likes) : 0))
  post.liked_by = Array.isArray(post.liked_by) ? post.liked_by : []
  post.category = post.category || 'General'
  post.replies = (post.replies || []).map((r: any) => ({ ...(r || {}), replies: Array.isArray(r?.replies) ? r.replies : [], likes: typeof r?.likes === 'number' ? r.likes : 0, liked_by: Array.isArray(r?.liked_by) ? r.liked_by : [] }))
  return post
}

export default function CommunityHighlight({ limit = 3 }: { limit?: number }) {
  const [posts, setPosts] = useState<any[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    ;(async () => {
      try {
        const remote = await getJSON('/api/forum')
        if (remote && Array.isArray(remote)) {
          setPosts((remote || []).map((p: any) => normalizePost(p)).slice(0, limit))
          return
        }
      } catch {
        // ignore and fallback
      }
      const stored = await loadItem('forum_posts')
      if (stored && Array.isArray(stored)) {
        setPosts(stored.map((p: any) => normalizePost(p)).slice(0, limit))
        return
      }
      // final fallback to seed data
      setPosts((forumData || []).map((p: any) => normalizePost(p)).slice(0, limit))
    })()
  }, [limit])

  if (!posts.length) return (
    <View style={styles.empty}><Text style={styles.emptyText}>{t('no_recent_discussions') || 'No recent discussions yet — be the first to post!'}</Text></View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('community_highlights') || 'Community Highlights'}</Text>
        <Link href="/community"><Text style={styles.viewAll}>{t('view_all') || 'View all'}</Text></Link>
      </View>
      {posts.map((p: any) => (
        <Link key={p.id} href="/community" style={{ textDecorationLine: 'none' }}>
          <TouchableOpacity style={styles.item} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{p.title || (p.content || p.text || '').slice(0, 60)}</Text>
              <Text style={styles.meta}>{p.author} • {p.time} • {p.category}</Text>
            </View>
            <View style={styles.counts}>
              <Text style={styles.count}>💬 {p.replies?.length ?? 0}</Text>
              <Text style={styles.count}>❤️ {p.likes ?? 0}</Text>
            </View>
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  viewAll: { color: '#0366d6' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  itemTitle: { fontWeight: '600' },
  meta: { color: '#6b7280', marginTop: 4, fontSize: 12 },
  counts: { marginLeft: 12, alignItems: 'flex-end' },
  count: { fontSize: 12, color: '#6b7280' },
  empty: { padding: 16 },
  emptyText: { color: '#6b7280' }
})
