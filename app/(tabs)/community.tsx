import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import CategoryPicker from '@/components/category-picker'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, postJSON, resolveMediaUrl } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import { translateCategory } from '@/lib/translate-data'
import forumData from '../../data/forum.json'

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

function formatTime(t: any) {
  try {
     const date = new Date(t)
     const diff = Date.now() - date.getTime()
     const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  } catch { return String(t) }
}

function ReplyView({ reply, onReply, onLike, onOpenProfile, canInteract }: { reply: any; onReply: (parentId: number, text: string, parentReplyId?: number) => void; onLike: (postId: number, replyId?: number) => void; onOpenProfile?: (userId: string) => void; canInteract: boolean }) {
  const { t } = useTranslation()
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [collapsed, setCollapsed] = useState(true)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const u = await resolveMediaUrl(reply.authorAvatar || null)
      if (!cancelled) setAvatarUri(u)
    })()
    return () => { cancelled = true }
  }, [reply.authorAvatar])
  return (
    <View style={{ marginTop: 8, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.smallAvatar}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.smallAvatarImg} /> : <Text style={{ fontSize: 14 }}>💬</Text>}
        </View>
        <TouchableOpacity disabled={!reply.authorUserId} onPress={() => reply.authorUserId && onOpenProfile?.(String(reply.authorUserId))} style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600' }}>{reply.author} • {formatTime(reply.time)}</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ marginTop: 4 }}>{reply.text}</Text>
      {reply.attachments?.map((a: any) => (
        <TouchableOpacity key={a.url} onPress={() => { /* noop */ }}>
          <Text style={{ color: '#0366d6', marginTop: 6 }}>{a.name || a.url}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => { if (!canInteract) return; setReplying(!replying) }}><Text style={styles.action}>💬 {reply.replies?.length ?? 0}</Text></TouchableOpacity>
        <LikeButton liked={!!reply.liked} count={reply.likes ?? 0} onPress={() => { if (!canInteract) return; onLike(Number(reply.postId || reply.parentPostId), Number(reply.id)) }} />
      </View>
      {replying && canInteract && (
        <View style={{ marginTop: 8 }}>
          <Input placeholder={t('reply_to_reply') || 'Reply to reply...'} value={replyText} onChangeText={setReplyText} />
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Button style={{ flex: 1, marginRight: 8 }} onPress={async () => { if (replyText.trim()) { await onReply(Number(reply.postId || reply.parentPostId), replyText, Number(reply.id)); setReplyText(''); setReplying(false) } }}>
              {t('reply')}
            </Button>
            <Button variant="outline" style={{ flex: 1 }} onPress={() => { setReplyText(''); setReplying(false) }}>
              {t('cancel')}
            </Button>
          </View>
        </View>
      )}
      { !collapsed && reply.replies?.map((r: any) => (
        <ReplyView key={r.id} reply={{ ...r, postId: reply.postId || reply.parentPostId }} onReply={onReply} onLike={onLike} onOpenProfile={onOpenProfile} canInteract={canInteract} />
      ))}
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={{ marginTop: 6 }}>
        <Text style={{ color: '#0366d6' }}>{collapsed ? t('show_replies') : t('hide_replies')}</Text>
      </TouchableOpacity>
    </View>
  )
}

function DiscussionItem({ item, onReply, onLike, onOpenProfile, canInteract }: { item: any; onReply: (id: number, text: string, parentReplyId?: number) => void; onLike: (id: number, replyId?: number) => void; onOpenProfile?: (userId: string) => void; canInteract: boolean }) {
  const { t } = useTranslation()
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const u = await resolveMediaUrl(item.authorAvatar || null)
      if (!cancelled) setAvatarUri(u)
    })()
    return () => { cancelled = true }
  }, [item.authorAvatar])

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} /> : <Text>💬</Text>}
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.title || item.text?.slice(0, 30)}</Text>
            <View style={styles.category}><Text style={styles.categoryText}>{translateCategory(item.category, t)}</Text></View>
          </View>
          <TouchableOpacity disabled={!item.authorUserId} onPress={() => item.authorUserId && onOpenProfile?.(String(item.authorUserId))}>
            <Text style={styles.meta}>{item.author} • {formatTime(item.time)}</Text>
          </TouchableOpacity>
          <Text style={styles.body}>{item.content || item.text}</Text>
          {item.attachments?.map((a: any) => (
            <TouchableOpacity key={a.url} onPress={() => { /* noop */ }}>
              <Text style={{ color: '#0366d6', marginTop: 6 }}>{a.name || a.url}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => { if (!canInteract) return; setReplying(!replying) }}><Text style={styles.action}>💬 {t('replies_count').replace('{n}', String(item.replies?.length ?? 0))}</Text></TouchableOpacity>
            <LikeButton liked={!!item.liked} count={item.likes ?? 0} onPress={() => { if (!canInteract) return; onLike(Number(item.id)) }} />
          </View>
          {replying && canInteract && (
              <View style={{ marginTop: 8 }}>
              <Input placeholder={t('write_reply') || 'Write a reply...'} value={replyText} onChangeText={setReplyText} />
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Button style={{ flex: 1, marginRight: 8 }} onPress={async () => { if (replyText.trim()) { await onReply(Number(item.id), replyText); setReplyText(''); setReplying(false) } }}>
                  {t('reply')}
                </Button>
                <Button variant="outline" style={{ flex: 1 }} onPress={() => { setReplyText(''); setReplying(false) }}>
                  {t('cancel')}
                </Button>
              </View>
            </View>
          )}
          <ReplyList post={item} replies={item.replies || []} onReply={onReply} onLike={onLike} onOpenProfile={onOpenProfile} canInteract={canInteract} />
        </View>
      </View>
    </View>
  )
}

function ReplyList({ post, replies, onReply, onLike, onOpenProfile, canInteract }: any) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(true)
  const n = replies?.length ?? 0
  return (
    <View>
      { !collapsed && (replies || []).map((r: any) => <ReplyView key={r.id} reply={{ ...r, postId: post.id }} onReply={onReply} onLike={onLike} onOpenProfile={onOpenProfile} canInteract={canInteract} />) }
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={{ marginTop: 6 }}>
        <Text style={{ color: '#0366d6' }}>{collapsed ? t('show_x_replies').replace('{count}', String(n)) : t('hide_replies')}</Text>
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
  const { width } = useWindowDimensions()
  const compact = width < 390
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t, lang } = useTranslation()
  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
  const { showToast } = useToast()
  const router = useRouter()
  const { token, user, isSignedIn } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const remote = await getJSON('/api/forum')
        setPosts((remote || []).map((p: any) => normalizePost(p)))
    } catch (_err) {
      console.warn('Failed to load forum, falling back to local', _err)
        const stored = await loadItem('forum_posts')
        if (stored) setPosts((stored || []).map((p: any) => normalizePost(p)))
        else setPosts((forumData || []).map((p: any) => normalizePost(p)))
      } finally {
        setLoading(false)
      }
    })()
    ;(async () => {
      const saved = await loadItem('liked_ids')
      if (saved) setLikedIds(saved)
    })()
  }, [lang])

  const userId = user?.id ?? null
  const canInteract = isSignedIn && !!token

  const openProfile = (uid: string) => {
    router.push(`/user/${uid}`)
  }

  const handlePost = async () => {
    if (!canInteract) {
      showToast(t('sign_in_to_post') || 'Sign in to post', 'error')
      router.push('/login')
      return
    }
    if (!text.trim()) return
    const timestamp = Date.now()
    const nowISO = new Date().toISOString()
    const newPost: any = {
      id: timestamp,
      author: user?.displayName || 'You',
      authorUserId: userId,
      title: text.slice(0, 30),
      content: text,
      replies: [],
      likes: 0,
      time: nowISO,
      timestamp,
      category,
    }
    if (attachments.length) newPost.attachments = attachments
    const prevPosts = posts
    const next = [newPost, ...posts]
    setPosts(next)
    await saveItem('forum_posts', next)
    try {
      await postJSON('/api/forum', newPost, token)
    } catch {
      console.warn('Failed to post remotely')
      showToast(t('register_failed') || 'Post failed. Check you are online and signed in.', 'error')
      setPosts(prevPosts)
      await saveItem('forum_posts', prevPosts)
    }
    setText('')
    setAttachments([])
  }

  // Attachment picking disabled in this build (unused). Install expo-image-picker
  // to enable native file attachments when needed.

  const likePost = async (postId: number, replyId?: number) => {
    if (!canInteract || !userId) {
      showToast(t('sign_in_to_interact') || 'Sign in to like or reply', 'error')
      router.push('/login')
      return
    }
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
      const body: any = {}
      if (replyId) body.replyId = replyId
      const res = await postJSON(`/api/forum/${postId}/like`, body, token)
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
      showToast(liked ? (t('like_success') || 'Liked') : (t('unlike_success') || 'Unliked'), 'success')
      await saveItem('forum_posts', reconciled)
    } catch {
      // rollback
      setPosts(prevPosts)
      const rolledBack = { ...likedIds }
      rolledBack[idKey] = currentlyLiked
      setLikedIds(rolledBack)
      await saveItem('liked_ids', rolledBack)
      showToast('Failed to update like. Please try again.', 'error')
      console.warn('like failed')
    }
  }

  const replyToPost = async (id: number, replyText: string) => {
    if (!canInteract || !token) {
      showToast(t('sign_in_to_interact') || 'Sign in to reply', 'error')
      router.push('/login')
      return
    }
    const reply = { id: Date.now(), author: user?.displayName || 'You', authorUserId: userId, text: replyText, time: new Date().toISOString(), timestamp: Date.now(), attachments: [] }
    try {
      await postJSON(`/api/forum/${id}/reply`, reply, token)
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
  <Text style={[styles.headerTitle, { color: colors.text }]}>{t('forum')}</Text>
  <Text style={[styles.headerSubtitle, { color: muted }]}>{t('forum_sub')}</Text>
      </View>

  <CardUI style={{ marginHorizontal: 16 }}>
          <Input placeholder={t('whats_on_your_mind')} value={text} onChangeText={setText} />
        <View style={[styles.composeRow, compact && styles.composeRowCompact]}>
            <Button style={{ flex: 1, marginRight: compact ? 0 : 8 }} onPress={handlePost}>
            {t('post_discussion')}
          </Button>
          <CategoryPicker category={category} setCategory={setCategory} options={derived} />
        </View>
  </CardUI>
      {loading ? (
        <View style={{ padding: 16 }}><Text>{t('loading')}</Text></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <CardUI style={{ marginHorizontal: 16 }}>
              <DiscussionItem item={item} onLike={likePost} onReply={replyToPost} onOpenProfile={openProfile} canInteract={canInteract} />
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
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center', marginRight: 8, overflow: 'hidden' },
  smallAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  content: { flex: 1, marginLeft: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  category: { backgroundColor: '#F0F7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 12, color: '#0366d6' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  body: { marginTop: 8, fontSize: 14, color: '#374151' },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  action: { fontSize: 12, color: '#6b7280', marginRight: 16 },
  composeRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  composeRowCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 8 }
})

