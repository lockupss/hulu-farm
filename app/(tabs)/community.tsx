import React, { useEffect, useState, useRef } from 'react'
import { Animated, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// useRouter removed (unused) to satisfy linter
import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { loadItem, saveItem } from '@/lib/storage'
import forumData from '../../data/forum.json'
import { getJSON, postJSON } from '@/lib/api'
import { useToast } from '@/components/toast'
import CategoryPicker from '@/components/category-picker'

function normalizePost(p: any) {
  const post = { ...p }
  // replies can be a number (seed) or an array; normalize to array of reply objects
  if (!post.replies || Array.isArray(post.replies) === false) post.replies = []
  // ensure likes is a number
  post.likes = typeof post.likes === 'number' ? post.likes : (Array.isArray(post.liked_by) ? post.liked_by.length : (post.likes ? Number(post.likes) : 0))
  post.liked_by = Array.isArray(post.liked_by) ? post.liked_by : []
  post.category = post.category || 'General'
  // normalize nested replies recursively
  post.replies = (post.replies || []).map((r: any) => ({ ...(r || {}), replies: Array.isArray(r?.replies) ? r.replies : [], likes: typeof r?.likes === 'number' ? r.likes : 0, liked_by: Array.isArray(r?.liked_by) ? r.liked_by : [] }))
  return post
}

function ReplyView({ reply, onReply, onLike }: { reply: any; onReply: (parentId: number, text: string, parentReplyId?: number) => void; onLike: (postId: number, replyId?: number) => void }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [collapsed, setCollapsed] = useState(true)
  return (
    <View style={{ marginTop: 8, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
      <Text style={{ fontSize: 13, fontWeight: '600' }}>{reply.author} • {reply.time}</Text>
      <Text style={{ marginTop: 4 }}>{reply.text}</Text>
      <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setReplying(!replying)}><Text style={styles.action}>💬 {reply.replies?.length ?? 0}</Text></TouchableOpacity>
        <LikeButton liked={!!reply.liked} count={reply.likes ?? 0} onPress={() => onLike(Number(reply.postId || reply.parentPostId), Number(reply.id))} />
      </View>
      {replying && (
        <View style={{ marginTop: 8 }}>
          <Input placeholder="Reply to reply..." value={replyText} onChangeText={setReplyText} />
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Button style={{ flex: 1, marginRight: 8 }} onPress={async () => { if (replyText.trim()) { await onReply(Number(reply.postId || reply.parentPostId), replyText, Number(reply.id)); setReplyText(''); setReplying(false) } }}>
              Reply
            </Button>
            <Button variant="outline" style={{ flex: 1 }} onPress={() => { setReplyText(''); setReplying(false) }}>
              Cancel
            </Button>
          </View>
        </View>
      )}
      { !collapsed && reply.replies?.map((r: any) => (
        <ReplyView key={r.id} reply={{ ...r, postId: reply.postId || reply.parentPostId }} onReply={onReply} onLike={onLike} />
      ))}
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={{ marginTop: 6 }}>
        <Text style={{ color: '#0366d6' }}>{collapsed ? 'Show replies' : 'Hide replies'}</Text>
      </TouchableOpacity>
    </View>
  )
}

function DiscussionItem({ item, onReply, onLike }: { item: any; onReply: (id: number, text: string, parentReplyId?: number) => void; onLike: (id: number, replyId?: number) => void }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={styles.avatar}><Text>💬</Text></View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.title || item.text?.slice(0, 30)}</Text>
            <View style={styles.category}><Text style={styles.categoryText}>{item.category}</Text></View>
          </View>
          <Text style={styles.meta}>{item.author} • {item.time}</Text>
          <Text style={styles.body}>{item.content || item.text}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => setReplying(!replying)}><Text style={styles.action}>💬 {item.replies?.length ?? 0} replies</Text></TouchableOpacity>
            <LikeButton liked={!!item.liked} count={item.likes ?? 0} onPress={() => onLike(Number(item.id))} />
          </View>
          {replying && (
            <View style={{ marginTop: 8 }}>
              <Input placeholder="Write a reply..." value={replyText} onChangeText={setReplyText} />
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Button style={{ flex: 1, marginRight: 8 }} onPress={async () => { if (replyText.trim()) { await onReply(Number(item.id), replyText); setReplyText(''); setReplying(false) } }}>
                  Reply
                </Button>
                <Button variant="outline" style={{ flex: 1 }} onPress={() => { setReplyText(''); setReplying(false) }}>
                  Cancel
                </Button>
              </View>
            </View>
          )}
          <ReplyList post={item} replies={item.replies || []} onReply={onReply} onLike={onLike} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

function ReplyList({ post, replies, onReply, onLike }: any) {
  const [collapsed, setCollapsed] = useState(true)
  return (
    <View>
      { !collapsed && (replies || []).map((r: any) => <ReplyView key={r.id} reply={{ ...r, postId: post.id }} onReply={onReply} onLike={onLike} />) }
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={{ marginTop: 6 }}>
        <Text style={{ color: '#0366d6' }}>{collapsed ? `Show ${replies?.length ?? 0} replies` : `Hide replies`}</Text>
      </TouchableOpacity>
    </View>
  )
}

function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current
  const color = liked ? '#ef4444' : '#6b7280'
  // smoother overshoot animation
  const animate = () => {
    scale.setValue(0.85)
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: 260, easing: Easing.out(Easing.elastic(1)), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.98, duration: 120, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, easing: Easing.in(Easing.quad), useNativeDriver: true })
    ]).start()
  }

  return (
    <TouchableOpacity onPress={() => { animate(); onPress() }} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ scale }], marginRight: 8 }}>
        <Text style={{ color, fontSize: 18 }}>{liked ? '❤️' : '🤍'}</Text>
      </Animated.View>
      <Text style={[styles.action, { color }]}>{count}</Text>
    </TouchableOpacity>
  )
}

export default function Community() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
  const { showToast } = useToast()
  const [posts, setPosts] = useState<any[]>([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const remote = await getJSON('/api/forum')
        setPosts((remote || []).map((p: any) => normalizePost(p)))
      } catch (err) {
        console.warn('Failed to load forum, falling back to local', err)
        const stored = await loadItem('forum_posts')
        if (stored) setPosts((stored || []).map((p: any) => normalizePost(p)))
        else setPosts((forumData || []).map((p: any) => normalizePost(p)))
      } finally {
        setLoading(false)
      }
    })()
    ;(async () => {
      // ensure anonymous user id exists
      const existing = await loadItem('anon_user_id')
      if (existing) setUserId(existing)
      else {
        // simple fallback id without external deps
        const id = `anon-${Date.now()}-${Math.floor(Math.random()*100000)}`
        setUserId(id)
        await saveItem('anon_user_id', id)
      }
      // load liked ids per device
      const saved = await loadItem('liked_ids')
      if (saved) setLikedIds(saved)
    })()
  }, [])

  const handlePost = async () => {
    if (!text.trim()) return
    const newPost = { id: Date.now(), author: 'You', title: text.slice(0, 30), content: text, replies: [], likes: 0, time: 'Just now', category }
    const next = [newPost, ...posts]
    setPosts(next)
    await saveItem('forum_posts', next)
    // send to server
    try {
      await postJSON('/api/forum', newPost)
    } catch (e) {
      console.warn('Failed to post remotely', e)
    }
    setText('')
  }

  const likePost = async (postId: number, replyId?: number) => {
    // optimistic update: toggle local state first
    const idKey = replyId ? `${postId}:${replyId}` : `${postId}`
    const currentlyLiked = !!likedIds[idKey]
    const optimisticLiked = !currentlyLiked
    const toggleLocal = (postsArr: any[]) => postsArr.map(p => {
      if (Number(p.id) !== Number(postId)) return p
      const copy = { ...p }
      if (replyId) {
        const updateReplyRec = (replies: any[]) => {
          if (!replies) return
          for (let r of replies) {
            if (Number(r.id) === Number(replyId)) {
              r.likes = (r.likes || 0) + (optimisticLiked ? 1 : -1)
              r.liked = optimisticLiked
              return true
            }
            if (r.replies) {
              const found = updateReplyRec(r.replies)
              if (found) return true
            }
          }
          return false
        }
        updateReplyRec(copy.replies)
      } else {
        copy.likes = (copy.likes || 0) + (optimisticLiked ? 1 : -1)
        copy.liked = optimisticLiked
      }
      return copy
    })

    const prevPosts = posts
    const nextPosts = toggleLocal(posts)
    setPosts(nextPosts)
    const nextLiked = { ...likedIds, [idKey]: optimisticLiked }
    setLikedIds(nextLiked)
    await saveItem('liked_ids', nextLiked)
    try {
      const body: any = { userId }
      if (replyId) body.replyId = replyId
      const res = await postJSON(`/api/forum/${postId}/like`, body)
      const newLikes = res.likes
      const liked = !!res.liked
      // reconcile counts from server
      const reconciled = posts.map(p => {
        if (Number(p.id) !== Number(postId)) return p
        const copy = { ...p }
        if (replyId) {
          const updateReplyRec = (replies: any[]) => {
            if (!replies) return
            for (let r of replies) {
              if (Number(r.id) === Number(replyId)) {
                r.likes = newLikes
                r.liked = liked
                return true
              }
              if (r.replies) {
                const found = updateReplyRec(r.replies)
                if (found) return true
              }
            }
            return false
          }
          updateReplyRec(copy.replies)
        } else {
          copy.likes = newLikes
          copy.liked = liked
        }
        return copy
      })
      setPosts(reconciled)
      const finalLiked = { ...likedIds, [idKey]: liked }
      setLikedIds(finalLiked)
      await saveItem('liked_ids', finalLiked)
      showToast(liked ? 'Liked' : 'Unliked', 'success')
      await saveItem('forum_posts', reconciled)
    } catch (e) {
      // rollback
      setPosts(prevPosts)
      const rolledBack = { ...likedIds }
      rolledBack[idKey] = currentlyLiked
      setLikedIds(rolledBack)
      await saveItem('liked_ids', rolledBack)
      showToast('Failed to update like. Please try again.', 'error')
      console.warn('like failed', e)
    }
  }

  const replyToPost = async (id: number, replyText: string) => {
    const reply = { id: Date.now(), author: 'You', text: replyText, time: 'Just now' }
    try {
      await postJSON(`/api/forum/${id}/reply`, reply)
      showToast('Reply posted', 'success')
    } catch (e) {
      showToast('Failed to post reply', 'error')
      console.warn('reply failed', e)
    }
    const next = posts.map(p => (Number(p.id) === Number(id) ? { ...p, replies: [reply, ...(p.replies || [])] } : p))
    setPosts(next)
    await saveItem('forum_posts', next)
  }

  // derive categories from posts + defaults
  const defaultCategories = ['General', 'Disease Management', 'Market Trends', 'Weather Preparation']
  const derived = Array.from(new Set([...(posts || []).map(p => p.category).filter(Boolean), ...defaultCategories]))

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
  <Text style={[styles.headerTitle, { color: colors.text }]}>Forum</Text>
  <Text style={[styles.headerSubtitle, { color: muted }]}>Connect with farmers and share experiences</Text>
      </View>

  <CardUI style={{ marginHorizontal: 16 }}>
        <Input placeholder="What's on your mind?" value={text} onChangeText={setText} />
        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
          <Button style={{ flex: 1, marginRight: 8 }} onPress={handlePost}>
            Post Discussion
          </Button>
          <CategoryPicker category={category} setCategory={setCategory} options={derived} />
        </View>
  </CardUI>
      {loading ? (
        <View style={{ padding: 16 }}><Text>Loading...</Text></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <CardUI style={{ marginHorizontal: 16 }}>
              <DiscussionItem item={item} onLike={likePost} onReply={replyToPost} />
            </CardUI>
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
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

