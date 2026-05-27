import CategoryPicker from '@/components/category-picker'
import { useToast } from '@/components/toast'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, postFormData, postJSON, resolveMediaUrl } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native'
import forumData from '../../data/forum.json'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ── Normalizers ────────────────────────────────────────────────────────────────
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
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return String(t) }
}

// ── Category chip colours ──────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'General':             { bg: '#EFF6FF', text: '#1D4ED8' },
  'Disease management':  { bg: '#FEF2F2', text: '#DC2626' },
  'weather':             { bg: '#F0FDF4', text: '#15803D' },
  'market trend':        { bg: '#FFF7ED', text: '#C2410C' },
}
function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: '#F3F4F6', text: '#374151' }
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ uri, name, size = 40 }: { uri?: string | null; name?: string; size?: number }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = name ? name.charCodeAt(0) * 5 % 360 : 200
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
      backgroundColor: `hsl(${hue},55%,88%)`, alignItems: 'center', justifyContent: 'center' }}>
      {uri
        ? <Image source={{ uri }} style={{ width: size, height: size }} />
        : <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: `hsl(${hue},45%,35%)` }}>{initials}</Text>
      }
    </View>
  )
}

// ── Animated Like Button ───────────────────────────────────────────────────────
function LikeButton({ liked, count, onPress, dark }: { liked: boolean; count: number; onPress: () => void; dark: boolean }) {
  const scale = useRef(new Animated.Value(1)).current
  const color = liked ? '#F91880' : dark ? '#71767B' : '#536471'

  const animate = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, bounciness: 18 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
    ]).start()
  }

  return (
    <TouchableOpacity onPress={() => { animate(); onPress() }}
      style={styles.actionPill} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Animated.Text style={{ transform: [{ scale }], fontSize: 16 }}>
        {liked ? '❤️' : '🤍'}
      </Animated.Text>
      {count > 0 && <Text style={[styles.actionCount, { color }]}>{count}</Text>}
    </TouchableOpacity>
  )
}

// ── Inline Reply Input ─────────────────────────────────────────────────────────
function InlineReplyInput({ placeholder, onSubmit, onCancel, dark }: {
  placeholder: string; onSubmit: (text: string) => void; onCancel: () => void; dark: boolean
}) {
  const [text, setText] = useState('')
  const tint = '#1D9BF0'
  return (
    <View style={[styles.inlineReply, { borderColor: dark ? '#2F3336' : '#EFF3F4', backgroundColor: dark ? '#16181C' : '#F7F9F9' }]}>
      <TextInput
        style={[styles.inlineInput, { color: dark ? '#E7E9EA' : '#0F1419' }]}
        placeholder={placeholder}
        placeholderTextColor={dark ? '#71767B' : '#536471'}
        value={text}
        onChangeText={setText}
        multiline autoFocus
      />
      <View style={styles.inlineReplyFooter}>
        <TouchableOpacity onPress={onCancel} style={styles.inlineCancelBtn}>
          <Text style={[styles.inlineCancelText, { color: dark ? '#71767B' : '#536471' }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { if (text.trim()) { onSubmit(text); setText('') } }}
          style={[styles.inlineSubmitBtn, { backgroundColor: tint }, !text.trim() && { opacity: 0.5 }]}
          disabled={!text.trim()}
        >
          <Text style={styles.inlineSubmitText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Reply Row ──────────────────────────────────────────────────────────────────
function ReplyRow({ reply, onReply, onLike, onOpenProfile, canInteract, dark, depth = 0 }: {
  reply: any; onReply: any; onLike: any; onOpenProfile?: any; canInteract: boolean; dark: boolean; depth?: number
}) {
  const { t } = useTranslation()
  const [replying, setReplying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const border = dark ? '#2F3336' : '#EFF3F4'
  const muted = dark ? '#71767B' : '#536471'

  useEffect(() => {
    let c = false
    resolveMediaUrl(reply.authorAvatar || null).then(u => { if (!c) setAvatarUri(u) })
    return () => { c = true }
  }, [reply.authorAvatar])

  const nestedCount = reply.replies?.length ?? 0

  return (
    <View style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <View style={styles.replyRow}>
        {/* Thread line */}
        <View style={{ alignItems: 'center', marginRight: 10 }}>
          <TouchableOpacity onPress={() => reply.authorUserId && onOpenProfile?.(String(reply.authorUserId))}>
            <Avatar uri={avatarUri} name={reply.author} size={28} />
          </TouchableOpacity>
          {(nestedCount > 0 && expanded) && (
            <View style={[styles.threadLine, { backgroundColor: border }]} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {/* Author + time */}
          <View style={styles.replyMeta}>
            <TouchableOpacity onPress={() => reply.authorUserId && onOpenProfile?.(String(reply.authorUserId))}>
              <Text style={[styles.replyAuthor, { color: dark ? '#E7E9EA' : '#0F1419' }]}>{reply.author}</Text>
            </TouchableOpacity>
            <Text style={[styles.dotSep, { color: muted }]}>·</Text>
            <Text style={[styles.replyTime, { color: muted }]}>{formatTime(reply.time)}</Text>
          </View>
          <Text style={[styles.replyBody, { color: dark ? '#C9D1D9' : '#0F1419' }]}>{reply.text}</Text>
          {/* Actions */}
          <View style={styles.replyActions}>
            <TouchableOpacity style={styles.actionPill} onPress={() => setReplying(!replying)}>
              <Text style={{ fontSize: 14 }}>💬</Text>
            </TouchableOpacity>
            <LikeButton liked={!!reply.liked} count={reply.likes ?? 0}
              onPress={() => onLike(String(reply.postId || reply.parentPostId), String(reply.id))} dark={dark} />
            {nestedCount > 0 && (
              <TouchableOpacity style={styles.actionPill} onPress={() => setExpanded(!expanded)}>
                <Text style={[styles.showMore, { color: '#1D9BF0' }]}>
                  {expanded ? '▲ Hide' : `▼ ${nestedCount} repl${nestedCount === 1 ? 'y' : 'ies'}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {replying && (
            <InlineReplyInput
              placeholder="Reply…"
              dark={dark}
              onSubmit={async (text) => {
                await onReply(String(reply.postId || reply.parentPostId), text, String(reply.id))
                setReplying(false)
              }}
              onCancel={() => setReplying(false)}
            />
          )}
          {expanded && reply.replies?.map((r: any) => (
            <ReplyRow key={r.id} reply={{ ...r, postId: reply.postId }} onReply={onReply} onLike={onLike}
              onOpenProfile={onOpenProfile} canInteract={canInteract} dark={dark} depth={depth + 1} />
          ))}
        </View>
      </View>
    </View>
  )
}

// ── Grid Card (compact 2-col tile) ───────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'General':            '🌾',
  'Disease management': '🦠',
  'weather':            '🌤️',
  'market trend':       '📈',
}

function GridCard({ item, onPress, onLike, dark }: {
  item: any; onPress: () => void; onLike: (id: string) => void; dark: boolean
}) {
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const scaleAnim = useRef(new Animated.Value(1)).current

  const border   = dark ? '#2F3336' : '#E4E7EB'
  const cardBg   = dark ? '#16181C' : '#FFFFFF'
  const muted    = dark ? '#71767B' : '#6B7280'
  const textMain = dark ? '#E7E9EA' : '#111827'
  const catStyle = categoryStyle(item.category)
  const icon     = CATEGORY_ICONS[item.category] ?? '📌'

  useEffect(() => {
    let c = false
    resolveMediaUrl(item.authorAvatar || null).then(u => { if (!c) setAvatarUri(u) })
    return () => { c = true }
  }, [item.authorAvatar])

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start()
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start()

  const replyCount = item.replies?.length ?? 0
  const preview = (item.content || item.text || '').slice(0, 120)
  const hasLongBody = preview.length > 80

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[gridStyles.card, { backgroundColor: cardBg, borderColor: border }]}
      >
        {/* Category icon badge */}
        <View style={[gridStyles.iconBadge, { backgroundColor: catStyle.bg }]}>
          <Text style={{ fontSize: 14 }}>{icon}</Text>
        </View>

        {/* Title */}
        {item.title ? (
          <Text style={[gridStyles.cardTitle, { color: textMain }]} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}

        {/* Body preview */}
        <Text
          style={[gridStyles.cardBody, { color: dark ? '#9CA3AF' : '#4B5563' }]}
          numberOfLines={hasLongBody ? 4 : 3}
        >
          {preview}
        </Text>

        {/* Footer */}
        <View style={gridStyles.cardFooter}>
          {/* Avatar + author */}
          <View style={gridStyles.cardAuthorRow}>
            <Avatar uri={avatarUri} name={item.author} size={20} />
            <Text style={[gridStyles.cardAuthor, { color: muted }]} numberOfLines={1}>
              {item.author}
            </Text>
          </View>

          {/* Stats row */}
          <View style={gridStyles.cardStats}>
            {replyCount > 0 && (
              <View style={gridStyles.statPill}>
                <Text style={{ fontSize: 11 }}>💬</Text>
                <Text style={[gridStyles.statText, { color: muted }]}>{replyCount}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); onLike(String(item.id)) }}
              style={gridStyles.statPill}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 11 }}>{item.liked ? '❤️' : '🤍'}</Text>
              {(item.likes ?? 0) > 0 && (
                <Text style={[gridStyles.statText, { color: item.liked ? '#F91880' : muted }]}>
                  {item.likes}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Time chip */}
        <Text style={[gridStyles.timeChip, { color: muted }]}>{formatTime(item.time)}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ── Post Card ──────────────────────────────────────────────────────────────────
// ── Post Image ────────────────────────────────────────────────────────────────
function PostImage({ uri }: { uri: string }) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    resolveMediaUrl(uri).then(u => { if (!cancelled) setResolvedUri(u) })
    return () => { cancelled = true }
  }, [uri])
  if (!resolvedUri) return null
  return (
    <Image
      source={{ uri: resolvedUri }}
      style={styles.postImage}
      resizeMode="cover"
    />
  )
}

function PostCard({ item, onReply, onLike, onOpenProfile, onReport, canInteract, dark }: {
  item: any; onReply: any; onLike: any; onOpenProfile?: any; onReport: any; canInteract: boolean; dark: boolean
}) {
  const { t } = useTranslation()
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  const border = dark ? '#2F3336' : '#EFF3F4'
  const muted = dark ? '#71767B' : '#536471'
  const textMain = dark ? '#E7E9EA' : '#0F1419'
  const cardBg = dark ? '#16181C' : '#FFFFFF'

  const replyCount = item.replies?.length ?? 0
  const catStyle = categoryStyle(item.category)

  useEffect(() => {
    let c = false
    resolveMediaUrl(item.authorAvatar || null).then(u => { if (!c) setAvatarUri(u) })
    return () => { c = true }
  }, [item.authorAvatar])

  return (
    <View style={[styles.postCard, { backgroundColor: cardBg, borderBottomColor: border }]}>
      {/* Left column: avatar + thread line */}
      <View style={styles.postLeft}>
        <TouchableOpacity onPress={() => item.authorUserId && onOpenProfile?.(String(item.authorUserId))}>
          <Avatar uri={avatarUri} name={item.author} size={42} />
        </TouchableOpacity>
        {showReplies && replyCount > 0 && (
          <View style={[styles.threadLine, { backgroundColor: border, flex: 1 }]} />
        )}
      </View>

      {/* Right column: content */}
      <View style={styles.postRight}>
        {/* Header: name · time · category */}
        <View style={styles.postHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.postNameRow}>
              <TouchableOpacity onPress={() => item.authorUserId && onOpenProfile?.(String(item.authorUserId))}>
                <Text style={[styles.postAuthorName, { color: textMain }]} numberOfLines={1}>{item.author}</Text>
              </TouchableOpacity>
              <Text style={[styles.dotSep, { color: muted }]}>·</Text>
              <Text style={[styles.postTimestamp, { color: muted }]}>{formatTime(item.time)}</Text>
            </View>
          </View>
          <View style={[styles.catChip, { backgroundColor: catStyle.bg }]}>
            <Text style={[styles.catChipText, { color: catStyle.text }]}>{item.category}</Text>
          </View>
        </View>

        {/* Post title */}
        {item.title && (
          <Text style={[styles.postTitle, { color: textMain }]}>{item.title}</Text>
        )}

        {/* Post body */}
        <Text style={[styles.postBody, { color: dark ? '#C9D1D9' : '#3D4043' }]}>
          {item.content || item.text}
        </Text>

        {/* Post image */}
        {item.image && (
          <PostImage uri={item.image} />
        )}

        {/* Attachments */}
        {item.attachments?.map((a: any) => (
          <TouchableOpacity key={a.url} style={[styles.attachRow, { borderColor: border }]}>
            <Text style={{ fontSize: 13 }}>📎</Text>
            <Text style={[styles.attachName, { color: '#1D9BF0' }]} numberOfLines={1}>{a.name || a.url}</Text>
          </TouchableOpacity>
        ))}

        {/* Action bar */}
        <View style={styles.actionBar}>
          {/* Replies */}
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => setReplying(!replying)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
            {replyCount > 0 && <Text style={[styles.actionCount, { color: muted }]}>{replyCount}</Text>}
          </TouchableOpacity>

          {/* Likes */}
          <LikeButton liked={!!item.liked} count={item.likes ?? 0}
            onPress={() => onLike(String(item.id))} dark={dark} />

          {/* Show replies toggle */}
          {replyCount > 0 && (
            <TouchableOpacity style={styles.actionPill} onPress={() => setShowReplies(!showReplies)}>
              <Text style={[styles.showMore, { color: '#1D9BF0' }]}>
                {showReplies ? 'Hide' : `${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Report */}
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => onReport(String(item.id), 'post', item.content || item.title || '')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 14, color: muted }}>🚩</Text>
          </TouchableOpacity>
        </View>

        {/* Inline compose reply */}
        {replying && (
          <InlineReplyInput
            placeholder="Post your reply…"
            dark={dark}
            onSubmit={async (text) => {
              await onReply(String(item.id), text)
              setReplying(false)
              setShowReplies(true)
            }}
            onCancel={() => setReplying(false)}
          />
        )}

        {/* Replies thread */}
        {showReplies && replyCount > 0 && (
          <View style={{ marginTop: 8 }}>
            {item.replies.map((r: any) => (
              <ReplyRow key={r.id} reply={{ ...r, postId: item.id }}
                onReply={onReply} onLike={onLike} onOpenProfile={onOpenProfile}
                canInteract={canInteract} dark={dark} />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

// ── Compose Modal ──────────────────────────────────────────────────────────────
function ComposeModal({ visible, onClose, onPost, user, dark }: {
  visible: boolean; onClose: () => void; onPost: (text: string, category: string, imageUri?: string) => void
  user: any; dark: boolean
}) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const tint = '#1D9BF0'
  const bg = dark ? '#000000' : '#FFFFFF'
  const border = dark ? '#2F3336' : '#EFF3F4'
  const muted = dark ? '#71767B' : '#536471'
  const textCol = dark ? '#E7E9EA' : '#0F1419'

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
    }
  }

  const removeImage = () => setImageUri(null)

  const submit = () => {
    if (!text.trim()) return
    onPost(text, category, imageUri ?? undefined)
    setText('')
    setCategory('General')
    setImageUri(null)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Modal header */}
        <View style={[styles.modalHeader, { borderBottomColor: border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
            <Text style={[styles.modalCancelText, { color: tint }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: textCol }]}>New Post</Text>
          <TouchableOpacity
            onPress={submit}
            style={[styles.modalPostBtn, { backgroundColor: tint }, !text.trim() && { opacity: 0.45 }]}
            disabled={!text.trim()}
          >
            <Text style={styles.modalPostBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Compose area */}
          <View style={[styles.modalBody, { borderBottomColor: border }]}>
            <Avatar name={user?.displayName} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <TextInput
                style={[styles.modalInput, { color: textCol }]}
                placeholder="What's happening on your farm?"
                placeholderTextColor={muted}
                value={text}
                onChangeText={setText}
                multiline
                autoFocus
                maxLength={500}
              />
            </View>
          </View>

          {/* Image preview */}
          {imageUri && (
            <View style={[styles.imagePreviewContainer, { borderColor: border }]}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Footer: photo button + category selector */}
        <View style={[styles.modalFooter, { borderTopColor: border }]}>
          <TouchableOpacity onPress={pickImage} style={[styles.photoPickerBtn, { borderColor: border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 20 }}>🖼️</Text>
          </TouchableOpacity>
          <Text style={[styles.categoryLabel, { color: muted }]}>Topic</Text>
          <CategoryPicker
            category={category}
            setCategory={setCategory}
            options={['General', 'Disease management', 'weather', 'market trend']}
          />
        </View>

        {/* Char counter */}
        <Text style={[styles.charCount, { color: text.length > 450 ? '#F91880' : muted }]}>
          {500 - text.length}
        </Text>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Main Community Screen ──────────────────────────────────────────────────────
export default function Community() {
  const colorScheme = useColorScheme()
  const dark = colorScheme === 'dark'
  const colors = Colors[colorScheme ?? 'light']
  const { t, lang } = useTranslation()
  const { showToast } = useToast()
  const router = useRouter()
  const { token, user, isSignedIn, loading: authLoading } = useAuth()

  const bg = dark ? '#000000' : '#F7F9F9'
  const border = dark ? '#2F3336' : '#EFF3F4'
  const muted = dark ? '#71767B' : '#536471'
  const textMain = dark ? '#E7E9EA' : '#0F1419'
  const tint = '#1D9BF0'

  const [posts, setPosts] = useState<any[]>([])
  const postsRef = useRef<any[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})
  const [composeOpen, setComposeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou')
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const updatePosts = useCallback((next: any[]) => {
    postsRef.current = next
    setPosts(next)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const remote = await getJSON('/api/v1/forum/posts/')
        const list = Array.isArray(remote) ? remote : (remote?.results || [])
        const normalized = list.map((p: any) => normalizePost(p))
        updatePosts(normalized)
        await saveItem('forum_posts', normalized)
      } catch {
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
  }, [lang, updatePosts])

  const canInteract = isSignedIn && !!token

  const requireAuth = (): boolean => {
    if (authLoading) return false
    if (!canInteract) {
      showToast(t('sign_in_to_interact') || 'Sign in to continue', 'error')
      router.push('/login')
      return false
    }
    return true
  }

  const handlePost = async (text: string, category: string, imageUri?: string) => {
    if (!canInteract) { showToast(t('sign_in_to_post') || 'Sign in to post', 'error'); router.push('/login'); return }
    const nowISO = new Date().toISOString()
    const newPost: any = {
      id: Date.now(), author: user?.displayName || 'You', authorUserId: user?.id,
      title: text.slice(0, 60), content: text, replies: [], likes: 0,
      time: nowISO, category, slug: String(Date.now()),
      image: imageUri || null,
    }
    const prev = postsRef.current
    updatePosts([newPost, ...prev])
    await saveItem('forum_posts', [newPost, ...prev])
    try {
      let created: any
      if (imageUri) {
        // Use multipart/form-data when an image is attached
        const formData = new FormData()
        formData.append('title', text.slice(0, 60) || 'Post')
        formData.append('body', text)
        formData.append('status', 'published')
        const filename = imageUri.split('/').pop() || 'photo.jpg'
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
        const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
        formData.append('image', { uri: imageUri, name: filename, type: mimeType } as any)
        created = await postFormData('/api/v1/forum/posts/', formData, token)
      } else {
        created = await postJSON('/api/v1/forum/posts/', { title: text.slice(0, 60) || 'Post', body: text, status: 'published' }, token)
      }
      if (created?.id) { const next = [normalizePost(created), ...prev]; updatePosts(next); await saveItem('forum_posts', next) }
    } catch (e: any) {
      showToast(e?.message || 'Post failed', 'error')
      updatePosts(prev); await saveItem('forum_posts', prev)
    }
  }

  const likePost = async (postId: string, replyId?: string) => {
    if (!requireAuth()) return
    const idKey = replyId ? `${postId}:${replyId}` : postId
    const currentlyLiked = !!likedIds[idKey]
    const optimistic = !currentlyLiked

    const toggleLocal = (arr: any[]) => arr.map(p => {
      if (String(p.id) !== String(postId)) return p
      const cp = { ...p }
      if (replyId) {
        const upd = (replies: any[]): boolean => {
          for (const r of replies || []) {
            if (String(r.id) === String(replyId)) { r.likes = (r.likes || 0) + (optimistic ? 1 : -1); r.liked = optimistic; return true }
            if (r.replies && upd(r.replies)) return true
          }
          return false
        }
        upd(cp.replies)
      } else { cp.likes = (cp.likes || 0) + (optimistic ? 1 : -1); cp.liked = optimistic }
      return cp
    })

    const prev = postsRef.current
    updatePosts(toggleLocal(prev))
    const nextLiked = { ...likedIds, [idKey]: optimistic }
    setLikedIds(nextLiked); await saveItem('liked_ids', nextLiked)

    try {
      let res: any
      if (replyId) {
        res = await postJSON(`/api/v1/forum/comments/${replyId}/like/`, {}, token)
      } else {
        const target = postsRef.current.find(p => String(p.id) === String(postId))
        res = await postJSON(`/api/v1/forum/posts/${target?.slug || postId}/like/`, {}, token)
      }
      const newLikes = res.likes_count ?? res.likes
      const liked = !!res.liked
      const reconciled = postsRef.current.map(p => {
        if (String(p.id) !== String(postId)) return p
        const cp = { ...p }
        if (replyId) {
          const upd = (replies: any[]): boolean => {
            for (const r of replies || []) {
              if (String(r.id) === String(replyId)) { r.likes = newLikes; r.liked = liked; return true }
              if (r.replies && upd(r.replies)) return true
            }
            return false
          }; upd(cp.replies)
        } else { cp.likes = newLikes; cp.liked = liked }
        return cp
      })
      updatePosts(reconciled)
      const fl = { ...likedIds, [idKey]: liked }; setLikedIds(fl); await saveItem('liked_ids', fl)
    } catch (e: any) {
      updatePosts(prev); const rb = { ...likedIds, [idKey]: currentlyLiked }; setLikedIds(rb); await saveItem('liked_ids', rb)
      showToast(e?.message || 'Failed to update like', 'error')
    }
  }

  const replyToPost = async (id: string, replyText: string, parentReplyId?: string) => {
    if (!requireAuth()) return
    if (!replyText.trim()) return
    const reply = {
      id: Date.now(), author: user?.displayName || 'You', authorUserId: user?.id,
      text: replyText, time: new Date().toISOString(), replies: [], likes: 0, liked_by: [],
    }
    try {
      const replyPost = postsRef.current.find(p => String(p.id) === String(id))
      const slug = replyPost?.slug || String(id)
      await postJSON(`/api/v1/forum/posts/${slug}/comments/`, {
        post: replyPost?.id, body: replyText,
        ...(parentReplyId ? { parent: parentReplyId } : {}),
      }, token)
      showToast('Reply posted', 'success')
      try {
        const fresh = await getJSON(`/api/v1/forum/posts/${slug}/comments/`, token)
        const list = Array.isArray(fresh) ? fresh : (fresh?.results || [])
        const next = postsRef.current.map(p => p.id === id ? { ...p, replies: list.map((c: any) => normalizeComment(c, p.id)) } : p)
        updatePosts(next); await saveItem('forum_posts', next)
      } catch {
        const next = postsRef.current.map(p => p.id === id ? { ...p, replies: [reply, ...(p.replies || [])] } : p)
        updatePosts(next); await saveItem('forum_posts', next)
      }
    } catch (e: any) { showToast(e?.message || 'Failed to post reply', 'error') }
  }

  const openReport = (id: string, type: string, preview: string) => {
    if (!canInteract) { showToast('Sign in to report', 'error'); router.push('/login'); return }
    router.push({ pathname: '/report', params: { target_type: type, target_id: id, target_preview: preview.slice(0, 300) } })
  }

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: dark ? 'rgba(0,0,0,0.85)' : 'rgba(247,249,249,0.9)', borderBottomColor: border }]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerLogo, { color: textMain }]}>🌿 Community</Text>
          <TouchableOpacity
            onPress={() => { if (!canInteract && !authLoading) { showToast('Sign in to post', 'error'); router.push('/login'); return } setComposeOpen(true) }}
            style={[styles.headerComposeBtn, { backgroundColor: tint }]}
          >
            <Text style={styles.headerComposeBtnText}>✦ Post</Text>
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['forYou', 'following'] as const).map(tab => (
            <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabLabel, { color: activeTab === tab ? textMain : muted }]}>
                {tab === 'forYou' ? 'For you' : 'Following'}
              </Text>
              {activeTab === tab && <View style={[styles.tabIndicator, { backgroundColor: tint }]} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── View mode toggle ── */}
      <View style={[gridStyles.modeBar, { borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => setViewMode('grid')}
          style={[gridStyles.modeBtn, viewMode === 'grid' && { backgroundColor: tint + '22' }]}
        >
          <Text style={[gridStyles.modeBtnText, { color: viewMode === 'grid' ? tint : muted }]}>⊞ Grid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          style={[gridStyles.modeBtn, viewMode === 'list' && { backgroundColor: tint + '22' }]}
        >
          <Text style={[gridStyles.modeBtnText, { color: viewMode === 'list' ? tint : muted }]}>☰ List</Text>
        </TouchableOpacity>
      </View>

      {/* ── Feed ── */}
      {loading ? (
        <ScrollView contentContainerStyle={[gridStyles.gridWrap, { paddingBottom: 100 }]}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={[gridStyles.skeletonCard, { backgroundColor: dark ? '#1A1A1A' : '#F0F0F0', width: '47%' }]}>
              <View style={[{ height: 14, borderRadius: 7, marginBottom: 8, backgroundColor: dark ? '#2A2A2A' : '#E0E0E0', width: '40%' }]} />
              <View style={[{ height: 13, borderRadius: 6, marginBottom: 6, backgroundColor: dark ? '#2A2A2A' : '#E0E0E0', width: '90%' }]} />
              <View style={[{ height: 13, borderRadius: 6, marginBottom: 6, backgroundColor: dark ? '#2A2A2A' : '#E0E0E0', width: '70%' }]} />
              <View style={[{ height: 13, borderRadius: 6, backgroundColor: dark ? '#2A2A2A' : '#E0E0E0', width: '80%' }]} />
            </View>
          ))}
        </ScrollView>
      ) : viewMode === 'grid' ? (
        /* ── 2-column masonry-style grid ── */
        posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: textMain }]}>Nothing here yet</Text>
            <Text style={[styles.emptySub, { color: muted }]}>Be the first to start a discussion</Text>
            <TouchableOpacity onPress={() => setComposeOpen(true)} style={[styles.emptyPostBtn, { backgroundColor: tint }]}>
              <Text style={styles.emptyPostBtnText}>Post something</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[gridStyles.gridWrap, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
            {/* Split into two columns */}
            {(() => {
              const left: any[] = []
              const right: any[] = []
              posts.forEach((p, i) => (i % 2 === 0 ? left : right).push(p))
              return (
                <View style={gridStyles.gridColumns}>
                  <View style={gridStyles.gridCol}>
                    {left.map(item => (
                      <GridCard
                        key={item.id}
                        item={item}
                        dark={dark}
                        onPress={() => setSelectedPost(item)}
                        onLike={id => likePost(id)}
                      />
                    ))}
                  </View>
                  <View style={gridStyles.gridCol}>
                    {right.map(item => (
                      <GridCard
                        key={item.id}
                        item={item}
                        dark={dark}
                        onPress={() => setSelectedPost(item)}
                        onLike={id => likePost(id)}
                      />
                    ))}
                  </View>
                </View>
              )
            })()}
          </ScrollView>
        )
      ) : (
        /* ── List view (original) ── */
        <FlatList
          data={posts}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <PostCard item={item} onLike={likePost} onReply={replyToPost}
              onOpenProfile={uid => router.push(`/user/${uid}`)} onReport={openReport}
              canInteract={canInteract} dark={dark} />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>🌱</Text>
              <Text style={[styles.emptyTitle, { color: textMain }]}>Nothing here yet</Text>
              <Text style={[styles.emptySub, { color: muted }]}>Be the first to start a discussion</Text>
              <TouchableOpacity onPress={() => setComposeOpen(true)} style={[styles.emptyPostBtn, { backgroundColor: tint }]}>
                <Text style={styles.emptyPostBtnText}>Post something</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Post detail modal (tap from grid) ── */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={{ flex: 1, backgroundColor: dark ? '#000' : '#F7F9F9' }}>
          {/* Close bar */}
          <View style={[gridStyles.detailHeader, { borderBottomColor: border, backgroundColor: dark ? 'rgba(0,0,0,0.9)' : 'rgba(247,249,249,0.95)' }]}>
            <TouchableOpacity onPress={() => setSelectedPost(null)} style={gridStyles.detailClose}>
              <Text style={{ color: tint, fontSize: 16 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
            {selectedPost && (
              <PostCard
                item={selectedPost}
                onLike={likePost}
                onReply={replyToPost}
                onOpenProfile={uid => { setSelectedPost(null); router.push(`/user/${uid}`) }}
                onReport={openReport}
                canInteract={canInteract}
                dark={dark}
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Floating compose FAB ── */}
      {!composeOpen && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: tint }]}
          onPress={() => {
            if (!canInteract && !authLoading) { showToast('Sign in to post', 'error'); router.push('/login'); return }
            setComposeOpen(true)
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>✦</Text>
        </TouchableOpacity>
      )}

      {/* ── Compose Modal ── */}
      <ComposeModal
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPost={handlePost}
        user={user}
        dark={dark}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  headerLogo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  headerComposeBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  headerComposeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Tabs
  tabBar: { flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabLabel: { fontSize: 15, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 3, width: 56, borderRadius: 3 },

  // Post card
  postCard: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postLeft: { alignItems: 'center', marginRight: 12, width: 42 },
  threadLine: { width: 2, flex: 1, minHeight: 20, marginTop: 6, borderRadius: 1 },
  postRight: { flex: 1, paddingBottom: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 3 },
  postNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  postAuthorName: { fontSize: 15, fontWeight: '700' },
  dotSep: { fontSize: 14 },
  postTimestamp: { fontSize: 14 },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  catChipText: { fontSize: 11, fontWeight: '700' },
  postTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, lineHeight: 22, letterSpacing: -0.2 },
  postBody: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 8 },
  attachName: { fontSize: 13, flex: 1 },

  // Action bar
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 4 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20 },
  actionCount: { fontSize: 13, fontWeight: '600' },
  showMore: { fontSize: 13, fontWeight: '700' },

  // Reply
  replyRow: { flexDirection: 'row', paddingVertical: 8 },
  replyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  replyAuthor: { fontSize: 14, fontWeight: '700' },
  replyTime: { fontSize: 13 },
  replyBody: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  replyActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Inline reply input
  inlineReply: { marginTop: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  inlineInput: { fontSize: 14, minHeight: 60, textAlignVertical: 'top', lineHeight: 20 },
  inlineReplyFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  inlineCancelBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  inlineCancelText: { fontSize: 14, fontWeight: '600' },
  inlineSubmitBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  inlineSubmitText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Compose modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: { paddingVertical: 4 },
  modalCancelText: { fontSize: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalPostBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  modalPostBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  modalBody: { flexDirection: 'row', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalInput: { fontSize: 18, lineHeight: 26, minHeight: 100, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  photoPickerBtn: { padding: 6, borderRadius: 8, borderWidth: 1 },
  imagePreviewContainer: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeImageText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 8, marginBottom: 4 },
  categoryLabel: { fontSize: 13, fontWeight: '700' },
  charCount: { textAlign: 'right', paddingRight: 16, paddingTop: 4, fontSize: 13, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1D9BF0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 22, fontWeight: '800' },

  // Skeleton loader
  emptyState: { padding: 32, alignItems: 'center', gap: 10 },
  skeleton: { flexDirection: 'row', gap: 12, padding: 16, marginHorizontal: 16, marginBottom: 1, borderRadius: 12 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonLine: { height: 14, borderRadius: 7 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  emptySub: { fontSize: 15, textAlign: 'center' },
  emptyPostBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})

// ── Grid Styles ───────────────────────────────────────────────────────────────
const gridStyles = StyleSheet.create({
  // View mode toggle bar
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Grid layout
  gridWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  gridColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCol: {
    flex: 1,
    gap: 10,
  },

  // Grid card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
    flexShrink: 1,
  },
  cardFooter: {
    gap: 6,
  },
  cardAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardAuthor: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeChip: {
    fontSize: 10,
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Skeleton
  skeletonCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  // Detail modal
  detailHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailClose: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
})