import CategoryPicker from '@/components/category-picker'
import { useToast } from '@/components/toast'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, postJSON, resolveMediaUrl } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import { translateCategory } from '@/lib/translate-data'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, FlatList, Image, KeyboardAvoidingView, LayoutAnimation, Platform, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View, useWindowDimensions } from 'react-native'
import forumData from '../../data/forum.json'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function normalizeComment(c: any, postId: any): any {
  const comment = { ...c }
  if (typeof c.author === 'object' && c.author !== null) {
    comment.authorUserId = c.author.id
    comment.authorAvatar = c.author.avatar || null
    comment.author = c.author.full_name || c.author.username || 'Unknown'
  }
  if (!comment.text && comment.body) comment.text = comment.body
  if (!comment.time && comment.created_at) comment.time = comment.created_at
  if (typeof comment.likes !== 'number') comment.likes = comment.likes_count ?? 0
  comment.liked = !!comment.is_liked
  comment.postId = postId
  comment.replies = Array.isArray(c.replies) ? c.replies.map((r: any) => normalizeComment(r, postId)) : []
  comment.liked_by = []
  return comment
}

function normalizePost(p: any) {
  const post = { ...p }
  if (typeof p.author === 'object' && p.author !== null) {
    post.authorUserId = p.author.id
    post.authorAvatar = p.author.avatar || null
    post.author = p.author.full_name || p.author.username || 'Unknown'
  }
  if (!post.content && post.body) post.content = post.body
  if (!post.time && post.created_at) post.time = post.created_at
  if (typeof post.likes !== 'number') post.likes = post.likes_count ?? 0
  post.liked = !!post.is_liked
  if (typeof post.category === 'object' && post.category !== null) {
    post.category = post.category.name || 'General'
  }
  post.category = post.category || 'General'
  post.slug = post.slug || String(post.id)
  if (Array.isArray(post.comments) && (!post.replies || post.replies.length === 0)) {
    post.replies = post.comments.map((c: any) => normalizeComment(c, post.id))
  }
  if (!Array.isArray(post.replies)) post.replies = []
  post.liked_by = []
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

function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current
  const color = liked ? '#ef4444' : '#6b7280'
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
      <Animated.View style={{ transform: [{ scale }], marginRight: 4 }}>
        <Text style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</Text>
      </Animated.View>
      <Text style={[styles.actionText, { color }]}>{count}</Text>
    </TouchableOpacity>
  )
}

function InlineReplyInput({ placeholder, onSubmit, onCancel }: { placeholder: string; onSubmit: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('')
  return (
    <View style={styles.inlineReplyBox}>
      <TextInput
        style={styles.inlineReplyInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
      />
      <View style={styles.inlineReplyActions}>
        <TouchableOpacity
          style={[styles.inlineBtn, styles.inlineBtnPrimary]}
          onPress={() => { if (text.trim()) { onSubmit(text); setText('') } }}
        >
          <Text style={styles.inlineBtnPrimaryText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.inlineBtn, styles.inlineBtnOutline]}
          onPress={onCancel}
        >
          <Text style={styles.inlineBtnOutlineText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ReplyView({ reply, onReply, onLike, onOpenProfile, canInteract }: {
  reply: any
  onReply: (parentId: string, text: string, parentReplyId?: string) => void
  onLike: (postId: string, replyId?: string) => void
  onOpenProfile?: (userId: string) => void
  canInteract: boolean
}) {
  const { t } = useTranslation()
  const [replying, setReplying] = useState(false)
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

  const nestedCount = reply.replies?.length ?? 0

  return (
    <View style={styles.replyRow}>
      <View style={styles.replyThreadLine} />
      <View style={styles.replyContent}>
        <View style={styles.replyAuthorRow}>
          <View style={styles.smallAvatar}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.smallAvatarImg} />
              : <Text style={{ fontSize: 12 }}>💬</Text>}
          </View>
          <TouchableOpacity disabled={!reply.authorUserId} onPress={() => reply.authorUserId && onOpenProfile?.(String(reply.authorUserId))}>
            <Text style={styles.replyAuthor}>{reply.author}</Text>
          </TouchableOpacity>
          <Text style={styles.replyTime}> • {formatTime(reply.time)}</Text>
        </View>

        <Text style={styles.replyText}>{reply.text}</Text>

        <View style={styles.replyActionsRow}>
          <TouchableOpacity
            onPress={() => setReplying(!replying)}
            style={styles.replyActionBtn}
          >
            <Text style={styles.actionText}>💬 {t('reply')}</Text>
          </TouchableOpacity>
          <LikeButton
            liked={!!reply.liked}
            count={reply.likes ?? 0}
            onPress={() => onLike(String(reply.postId || reply.parentPostId), String(reply.id))}
          />
          {nestedCount > 0 && (
            <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.replyActionBtn}>
              <Text style={styles.showRepliesText}>
                {collapsed ? `▶ ${nestedCount} ${nestedCount === 1 ? 'reply' : 'replies'}` : '▼ Hide'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {replying && (
          <InlineReplyInput
            placeholder={t('reply_to_reply') || 'Reply to reply...'}
            onSubmit={async (text) => {
              await onReply(String(reply.postId || reply.parentPostId), text, String(reply.id))
              setReplying(false)
            }}
            onCancel={() => setReplying(false)}
          />
        )}

        {!collapsed && reply.replies?.map((r: any) => (
          <ReplyView
            key={r.id}
            reply={{ ...r, postId: reply.postId || reply.parentPostId }}
            onReply={onReply}
            onLike={onLike}
            onOpenProfile={onOpenProfile}
            canInteract={canInteract}
          />
        ))}
      </View>
    </View>
  )
}

function ReplyList({ post, replies, onReply, onLike, onOpenProfile, canInteract }: any) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(true)
  const n = replies?.length ?? 0
  if (n === 0) return null
  return (
    <View style={{ marginTop: 8 }}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.showRepliesBtn}>
        <Text style={styles.showRepliesText}>
          {collapsed ? `▶ ${t('show_x_replies').replace('{count}', String(n))}` : `▼ ${t('hide_replies')}`}
        </Text>
      </TouchableOpacity>
      {!collapsed && (replies || []).map((r: any) =>
        <ReplyView
          key={r.id}
          reply={{ ...r, postId: post.id }}
          onReply={onReply}
          onLike={onLike}
          onOpenProfile={onOpenProfile}
          canInteract={canInteract}
        />
      )}
    </View>
  )
}

function DiscussionItem({ item, onReply, onLike, onOpenProfile, canInteract }: {
  item: any
  onReply: (id: string, text: string, parentReplyId?: string) => void
  onLike: (id: string, replyId?: string) => void
  onOpenProfile?: (userId: string) => void
  canInteract: boolean
}) {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const compact = width < 390
  const [replying, setReplying] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const u = await resolveMediaUrl(item.authorAvatar || null)
      if (!cancelled) setAvatarUri(u)
    })()
    return () => { cancelled = true }
  }, [item.authorAvatar])

  const replyCount = item.replies?.length ?? 0

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeaderRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{translateCategory(item.category, t)}</Text>
        </View>
      </View>

      <Text style={styles.postTitle} numberOfLines={2}>{item.title || item.text?.slice(0, 60)}</Text>

      <View style={styles.postAuthorRow}>
        <View style={styles.avatar}>
          {avatarUri
            ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            : <Text style={{ fontSize: 16 }}>🧑‍🌾</Text>}
        </View>
        <TouchableOpacity disabled={!item.authorUserId} onPress={() => item.authorUserId && onOpenProfile?.(String(item.authorUserId))}>
          <Text style={styles.postAuthor}>{item.author}</Text>
        </TouchableOpacity>
        <Text style={styles.postTime}> • {formatTime(item.time)}</Text>
      </View>

      <Text style={styles.postBody}>{item.content || item.text}</Text>

      {item.attachments?.map((a: any) => (
        <TouchableOpacity key={a.url}>
          <Text style={styles.attachmentLink}>{a.name || a.url}</Text>
        </TouchableOpacity>
      ))}

      <View style={[styles.postActionsRow, compact && styles.postActionsRowCompact]}>
        <TouchableOpacity
          onPress={() => setReplying(!replying)}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</Text>
        </TouchableOpacity>
        <LikeButton
          liked={!!item.liked}
          count={item.likes ?? 0}
          onPress={() => onLike(String(item.id))}
        />
      </View>

      {replying && (
        <InlineReplyInput
          placeholder={t('write_reply') || 'Write a reply...'}
          onSubmit={async (text) => {
            await onReply(String(item.id), text)
            setReplying(false)
          }}
          onCancel={() => setReplying(false)}
        />
      )}

      <ReplyList
        post={item}
        replies={item.replies || []}
        onReply={onReply}
        onLike={onLike}
        onOpenProfile={onOpenProfile}
        canInteract={canInteract}
      />
    </View>
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
  const { token, user, isSignedIn, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  // Keep a ref so likePost / replyToPost always see the latest posts
  const postsRef = useRef<any[]>([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})

  const [isExpanded, setIsExpanded] = useState(false)
  const rotateAnim = useRef(new Animated.Value(0)).current

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const nextState = !isExpanded
    setIsExpanded(nextState)
    Animated.timing(rotateAnim, {
      toValue: nextState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  })

  // Keep postsRef in sync with posts state
  const updatePosts = (next: any[]) => {
    postsRef.current = next
    setPosts(next)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const remote = await getJSON('/api/v1/forum/posts/')
        const list = Array.isArray(remote) ? remote : (remote?.results || [])
        const normalized = list.map((p: any) => normalizePost(p))
        updatePosts(normalized)
        // Cache for offline fallback only — never used as source of truth
        await saveItem('forum_posts', normalized)
      } catch (_err) {
        // Offline fallback — show cached or seed data
        const stored = await loadItem('forum_posts')
        if (stored) updatePosts((stored || []).map((p: any) => normalizePost(p)))
        else updatePosts((forumData || []).map((p: any) => normalizePost(p)))
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

  // FIX: don't treat user as not signed in while auth is still loading
  const canInteract = isSignedIn && !!token

  const requireAuth = (): boolean => {
    if (authLoading) return false // still loading — do nothing
    if (!canInteract) {
      showToast(t('sign_in_to_interact') || 'Sign in to like or reply', 'error')
      router.push('/login')
      return false
    }
    return true
  }

  const openProfile = (uid: string) => { router.push(`/user/${uid}`) }

  const handlePost = async () => {
    if (authLoading) return
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
      title: text.slice(0, 60),
      content: text,
      replies: [],
      likes: 0,
      time: nowISO,
      timestamp,
      category,
      slug: String(timestamp),
    }
    const prevPosts = postsRef.current
    updatePosts([newPost, ...prevPosts])
    await saveItem('forum_posts', [newPost, ...prevPosts])
    toggleExpanded()
    try {
      const created = await postJSON('/api/v1/forum/posts/', {
        title: text.slice(0, 60) || 'Post',
        body: text,
        status: 'published',
      }, token)
      if (created?.id) {
        const next = [normalizePost(created), ...prevPosts]
        updatePosts(next)
        await saveItem('forum_posts', next)
      }
    } catch (e: any) {
      showToast(e?.message || 'Post failed. Check you are online and signed in.', 'error')
      updatePosts(prevPosts)
      await saveItem('forum_posts', prevPosts)
    }
    setText('')
  }

  const likePost = async (postId: string, replyId?: string) => {
    // FIX: don't redirect while auth is still loading
    if (!requireAuth()) return

    const idKey = replyId ? `${postId}:${replyId}` : `${String(postId)}`
    const currentlyLiked = !!likedIds[idKey]
    const optimisticLiked = !currentlyLiked

    const toggleLocal = (postsArr: any[]) => postsArr.map(p => {
      if (String(p.id) !== String(postId)) return p
      const copy = { ...p }
      if (replyId) {
        const updateReplyRec = (replies: any[]) => {
          if (!replies) return false
          for (const r of replies) {
            if (String(r.id) === String(replyId)) {
              r.likes = (r.likes || 0) + (optimisticLiked ? 1 : -1)
              r.liked = optimisticLiked
              return true
            }
            if (r.replies && updateReplyRec(r.replies)) return true
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

    const prevPosts = postsRef.current
    updatePosts(toggleLocal(prevPosts))
    const nextLiked = { ...likedIds, [idKey]: optimisticLiked }
    setLikedIds(nextLiked)
    await saveItem('liked_ids', nextLiked)

    try {
      let res: any
      if (replyId) {
        // FIX: comment likes use the comment pk endpoint, not the post slug endpoint
        res = await postJSON(`/api/v1/forum/comments/${replyId}/like/`, {}, token)
      } else {
        // FIX: use postsRef so we always get the latest slug, not stale closure
        const targetPost = postsRef.current.find(p => String(p.id) === String(postId))
        const postSlug = targetPost?.slug || String(postId)
        res = await postJSON(`/api/v1/forum/posts/${postSlug}/like/`, {}, token)
      }

      const newLikes = res.likes_count ?? res.likes
      const liked = !!res.liked

      const reconciled = postsRef.current.map(p => {
        if (String(p.id) !== String(postId)) return p
        const copy = { ...p }
        if (replyId) {
          const updateReplyRec = (replies: any[]) => {
            if (!replies) return false
            for (const r of replies) {
              if (String(r.id) === String(replyId)) { r.likes = newLikes; r.liked = liked; return true }
              if (r.replies && updateReplyRec(r.replies)) return true
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

      updatePosts(reconciled)
      const finalLiked = { ...likedIds, [idKey]: liked }
      setLikedIds(finalLiked)
      await saveItem('liked_ids', finalLiked)
      showToast(liked ? (t('like_success') || 'Liked') : (t('unlike_success') || 'Unliked'), 'success')
    } catch (e: any) {
      // Roll back optimistic update
      updatePosts(prevPosts)
      const rolledBack = { ...likedIds, [idKey]: currentlyLiked }
      setLikedIds(rolledBack)
      await saveItem('liked_ids', rolledBack)
      showToast(e?.message || 'Failed to update like. Please try again.', 'error')
    }
  }

  const replyToPost = async (id: string, replyText: string, parentReplyId?: string) => {
    if (!requireAuth()) return
    if (!replyText.trim()) return

    const reply = {
      id: Date.now(),
      author: user?.displayName || 'You',
      authorUserId: userId,
      text: replyText,
      time: new Date().toISOString(),
      timestamp: Date.now(),
      attachments: [],
      parentReplyId,
      replies: [],
      likes: 0,
      liked_by: [],
    }

    try {
      // FIX: use postsRef so slug lookup always works, never stale
      const replyPost = postsRef.current.find(p => String(p.id) === String(id))
      const replySlug = replyPost?.slug || String(id)

      // Send post id in body — CommentSerializer has 'post' as writable so DRF
      // validates it before perform_create can set it from the URL slug.
      await postJSON(`/api/v1/forum/posts/${replySlug}/comments/`, {
        post: replyPost?.id,
        body: replyText,
        ...(parentReplyId ? { parent: parentReplyId } : {}),
      }, token)

      showToast('Reply posted', 'success')

      // Reload the post's comments from server so they persist across users/sessions
      try {
        const freshComments = await getJSON(`/api/v1/forum/posts/${replySlug}/comments/`, token)
        const commentsList = Array.isArray(freshComments) ? freshComments : (freshComments?.results || [])
        const next = postsRef.current.map(p => {
          if (String(p.id) !== String(id)) return p
          return { ...p, replies: commentsList.map((c: any) => normalizeComment(c, p.id)) }
        })
        updatePosts(next)
        await saveItem('forum_posts', next)
      } catch {
        // Fallback: optimistic local insert if reload fails
        const addReplyLocal = (postsArr: any[]) => postsArr.map(p => {
          if (String(p.id) !== String(id)) return p
          const copy = { ...p }
          copy.replies = [reply, ...(copy.replies || [])]
          return copy
        })
        const next = addReplyLocal(postsRef.current)
        updatePosts(next)
        await saveItem('forum_posts', next)
      }
    } catch (e: any) {
      // FIX: show the actual error so you know what went wrong
      showToast(e?.message || 'Failed to post reply', 'error')
    }
  }

  const derived = ['General', 'Diesease management', 'weather', 'market trend']

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('forum')}</Text>
        <Text style={[styles.headerSubtitle, { color: muted }]}>{t('forum_sub')}</Text>
      </View>

      <View style={[styles.composeBox, { borderColor: colors.tint + '33', backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F9FAFB' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleExpanded}
          style={styles.collapsibleHeader}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Text style={{ fontSize: 16 }}>📝</Text>
            <Text style={[styles.collapsibleTitle, { color: colors.text }]}>{t('post_discussion') || 'Post'}</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Text style={[styles.collapsibleIcon, { color: colors.tint }]}>＋</Text>
          </Animated.View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.collapsibleContent, { borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <TextInput
              style={[styles.composeInput, { color: colors.text, marginTop: 4 }]}
              placeholder={t('whats_on_your_mind')}
              placeholderTextColor={muted}
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={2}
            />
            <View style={[styles.composeActions, compact && styles.composeActionsCompact]}>
              <View style={{ flex: 1, marginRight: compact ? 0 : 8, marginBottom: compact ? 6 : 0 }}>
                <CategoryPicker category={category} setCategory={setCategory} options={derived} />
              </View>
              <TouchableOpacity
                style={[styles.postBtn, { backgroundColor: colors.tint }, !text.trim() && styles.postBtnDisabled]}
                onPress={handlePost}
                disabled={!text.trim()}
              >
                <Text style={styles.postBtnText}>{t('post_discussion')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: muted }}>{t('loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <DiscussionItem
              item={item}
              onLike={likePost}
              onReply={replyToPost}
              onOpenProfile={openProfile}
              canInteract={canInteract}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F3F4F6', marginHorizontal: 16 }} />}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>🌱</Text>
              <Text style={{ color: muted, marginTop: 8, textAlign: 'center' }}>{t('no_recent_discussions')}</Text>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  composeBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 10,
    position: 'relative',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  collapsibleHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  collapsibleTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  collapsibleIcon: { fontSize: 18, fontWeight: '600' },
  collapsibleContent: { marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  composeInput: { fontSize: 14, minHeight: 52, textAlignVertical: 'top', paddingHorizontal: 4, paddingVertical: 4 },
  composeActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  composeActionsCompact: { flexDirection: 'column', alignItems: 'stretch' },
  postBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  postCard: { paddingHorizontal: 16, paddingVertical: 14 },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  categoryBadge: { backgroundColor: '#EBF5FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: '#1D6FA4' },
  postTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 20 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 6 },
  avatarImg: { width: 24, height: 24, borderRadius: 12 },
  postAuthor: { fontSize: 12, fontWeight: '600', color: '#374151' },
  postTime: { fontSize: 12, color: '#9CA3AF' },
  postBody: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 10 },
  attachmentLink: { color: '#0366d6', marginTop: 4, fontSize: 13 },
  postActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  postActionsRowCompact: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 12, color: '#6b7280' },
  showRepliesBtn: { paddingVertical: 4 },
  showRepliesText: { fontSize: 12, color: '#0366d6', fontWeight: '600' },
  replyRow: { flexDirection: 'row', marginTop: 10 },
  replyThreadLine: { width: 2, backgroundColor: '#E5E7EB', marginRight: 10, borderRadius: 1 },
  replyContent: { flex: 1 },
  replyAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  smallAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center', marginRight: 6, overflow: 'hidden' },
  smallAvatarImg: { width: 20, height: 20, borderRadius: 10 },
  replyAuthor: { fontSize: 12, fontWeight: '600', color: '#374151' },
  replyTime: { fontSize: 11, color: '#9CA3AF' },
  replyText: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginBottom: 4 },
  replyActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  replyActionBtn: { paddingVertical: 2 },
  inlineReplyBox: { marginTop: 8, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', padding: 8 },
  inlineReplyInput: { fontSize: 13, color: '#111827', minHeight: 44, textAlignVertical: 'top' },
  inlineReplyActions: { flexDirection: 'row', gap: 8, marginTop: 6, justifyContent: 'flex-end' },
  inlineBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  inlineBtnPrimary: { backgroundColor: '#16A34A' },
  inlineBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  inlineBtnOutline: { borderWidth: 1, borderColor: '#D1D5DB' },
  inlineBtnOutlineText: { color: '#374151', fontWeight: '600', fontSize: 12 },
})