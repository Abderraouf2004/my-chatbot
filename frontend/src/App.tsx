import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import './App.css'

type User = { id: string }
type Conversation = { id: string; title: string; createdAt: string; updatedAt: string }
type Message = { id: string; conversationId: string; role: 'user' | 'assistant' | string; content: string; createdAt: string }
type ApiEnvelope<T> = { data: T; message?: string; meta?: { page: number; totalPages: number; total: number } }

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const TOKEN_KEY = 'my-chatbot.access-token'
const REFRESH_KEY = 'my-chatbot.refresh-token'

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(`Cannot connect to the API at ${API_URL}. Make sure the backend is running.`)
  }
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : typeof payload.error === 'string' ? payload.error : `Request failed (${response.status})`
    throw new Error(message)
  }
  return payload as T
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.1L19 22l-1.1-2.9L15 18l2.9-1.2Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.sparkle}</svg>
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (accessToken: string, refreshToken?: string) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const result = await api<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(`/api/auth/${mode}`, {
        method: 'POST', body: JSON.stringify(mode === 'signup' ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password }),
      })
      onAuthenticated(result.data.accessToken, result.data.refreshToken)
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return <main className="auth-page">
    <div className="auth-glow glow-one" /><div className="auth-glow glow-two" />
    <header className="auth-top"><a className="brand" href="#home"><span className="brand-mark"><Icon name="sparkle" size={21} /></span><span>nova<span className="brand-light">.ai</span></span></a><span className="top-note">A clearer way to think.</span></header>
    <section className="auth-layout">
      <div className="auth-story">
        <div className="eyebrow"><span className="eyebrow-dot" /> YOUR AI WORKSPACE</div>
        <h1>Ideas become<br /><span>something more.</span></h1>
        <p>Meet your thoughtful AI companion. Explore ideas, solve problems, and bring your next big thing to life.</p>
        <div className="story-orbit"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit-core"><Icon name="sparkle" size={35} /></div><span className="orbit-star star-a">✳</span><span className="orbit-star star-b">✦</span><span className="orbit-star star-c">✧</span></div>
        <div className="story-foot"><span className="avatar-stack"><i>R</i><i>M</i><i>A</i></span><span>Made for curious minds</span><span className="tiny-separator">·</span><span>Powered by AI</span></div>
      </div>
      <div className="auth-card">
        <div className="auth-card-heading"><span className="mini-icon"><Icon name="sparkle" size={19} /></span><div><h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2><p>{mode === 'signin' ? 'Pick up where your curiosity left off.' : 'Your next great idea starts here.'}</p></div></div>
        <div className="auth-tabs"><button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError('') }}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>Create account</button></div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label>Full name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" minLength={3} maxLength={30} required /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required /></label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="primary-button auth-submit" disabled={busy}>{busy ? <span className="spinner" /> : mode === 'signin' ? 'Sign in to Nova' : 'Create account'}<span>↗</span></button>
        </form>
        <p className="auth-terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </div>
    </section>
    <footer className="auth-footer"><span>© 2026 Nova AI</span><span><i /> All systems operational</span><span>Built for what’s next</span></footer>
  </main>
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_KEY) || '')
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [pageError, setPageError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuId, setMenuId] = useState('')
  const [renamingId, setRenamingId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [dark, setDark] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const signOut = useCallback(async () => {
    if (token) { try { await api('/api/auth/signout', { method: 'POST' }, token) } catch { /* local sign out still works */ } }
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY)
    setToken(''); setRefreshToken(''); setUser(null); setConversations([]); setMessages([]); setActiveId('')
  }, [token])

  const authenticate = useCallback((access: string, refresh?: string) => {
    localStorage.setItem(TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    setToken(access); setRefreshToken(refresh || '')
  }, [])

  const loadConversations = useCallback(async (access: string) => {
    const result = await api<ApiEnvelope<Conversation[]>>('/api/conversation?page=1&limit=100', {}, access)
    setConversations(result.data || [])
    return result.data || []
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function boot() {
      try {
        const result = await api<ApiEnvelope<{ user: User }>>('/api/auth/verify', {}, token)
        if (cancelled) return
        setUser(result.data.user)
        const list = await loadConversations(token)
        if (!cancelled && list.length && !activeId) setActiveId(list[0].id)
      } catch {
        if (refreshToken) {
          try {
            const refreshed = await api<ApiEnvelope<{ accessToken: string }>>('/api/auth/refresh', { method: 'POST' }, refreshToken)
            if (cancelled) return
            localStorage.setItem(TOKEN_KEY, refreshed.data.accessToken); setToken(refreshed.data.accessToken)
          } catch { if (!cancelled) signOut() }
        } else if (!cancelled) signOut()
      }
    }
    void boot()
    return () => { cancelled = true }
  // Boot once per token change; active conversation is intentionally not a dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loadConversations, refreshToken, signOut])

  const activeConversation = useMemo(() => conversations.find(c => c.id === activeId), [conversations, activeId])

  useEffect(() => {
    if (!token || !activeId) { setMessages([]); return }
    let cancelled = false
    async function loadMessages() {
      setLoading(true); setPageError('')
      try {
        const result = await api<ApiEnvelope<Message[]>>(`/api/conversation/${activeId}/messages?page=1&limit=100`, {}, token)
        if (!cancelled) setMessages((result.data || []).slice().reverse())
      } catch (err) { if (!cancelled) { setMessages([]); setPageError(err instanceof Error ? err.message : 'Could not load messages.') } }
      finally { if (!cancelled) setLoading(false) }
    }
    void loadMessages()
    return () => { cancelled = true }
  }, [token, activeId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, sending, loading])

  async function createConversation() {
    if (!token) return
    setPageError('')
    try {
      const result = await api<ApiEnvelope<Conversation>>('/api/conversation', { method: 'POST', body: JSON.stringify({ title: 'New conversation' }) }, token)
      setConversations(prev => [result.data, ...prev]); setActiveId(result.data.id); setMessages([]); setSidebarOpen(false); inputRef.current?.focus()
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Could not create a conversation.') }
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault()
    const content = draft.trim()
    if (!content || sending || !token) return
    setDraft(''); setPageError(''); setSending(true)
    let conversationId = activeId
    try {
      if (!conversationId) {
        const created = await api<ApiEnvelope<Conversation>>('/api/conversation', { method: 'POST', body: JSON.stringify({ title: content.slice(0, 48) }) }, token)
        conversationId = created.data.id
        setConversations(prev => [created.data, ...prev]); setActiveId(conversationId)
      } else if (activeConversation?.title === 'New conversation' && messages.length === 0) {
        const title = content.slice(0, 48)
        const updated = await api<ApiEnvelope<Conversation>>(`/api/conversation/${conversationId}`, { method: 'PUT', body: JSON.stringify({ title }) }, token)
        setConversations(prev => prev.map(c => c.id === conversationId ? updated.data : c))
      }
      const optimistic: Message = { id: `pending-${Date.now()}`, conversationId, role: 'user', content, createdAt: new Date().toISOString() }
      setMessages(prev => [...prev, optimistic])
      const result = await api<ApiEnvelope<{ userMessage: Message; assistantMessage: Message }>>(`/api/conversation/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, token)
      setMessages(prev => [...prev.filter(m => !m.id.startsWith('pending-')), result.data.userMessage, result.data.assistantMessage])
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)))
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.id.startsWith('pending-')))
      setDraft(content); setPageError(err instanceof Error ? err.message : 'Message could not be sent.')
    } finally { setSending(false); inputRef.current?.focus() }
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() }
  }

  async function deleteConversation(id: string) {
    if (!token) return
    try {
      await api(`/api/conversation/${id}`, { method: 'DELETE' }, token)
      const remaining = conversations.filter(c => c.id !== id)
      setConversations(remaining); setMenuId('')
      if (activeId === id) { setActiveId(remaining[0]?.id || ''); setMessages([]) }
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Could not delete conversation.') }
  }

  async function renameConversation(id: string) {
    const title = renameValue.trim()
    if (title.length < 2 || !token) return
    try {
      const result = await api<ApiEnvelope<Conversation>>(`/api/conversation/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }, token)
      setConversations(prev => prev.map(c => c.id === id ? result.data : c)); setRenamingId(''); setMenuId('')
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Could not rename conversation.') }
  }

  const filteredConversations = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  if (!token || !user) return <AuthScreen onAuthenticated={authenticate} />

  return <main className={`app-shell ${dark ? 'theme-dark' : 'theme-light'}`}>
    {sidebarOpen && <button className="mobile-scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><a className="brand" href="#home"><span className="brand-mark"><Icon name="sparkle" size={20} /></span><span>nova<span className="brand-light">.ai</span></span></a><button className="icon-button sidebar-collapse" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><Icon name="menu" /></button></div>
      <button className="new-chat-button" onClick={() => void createConversation()}><Icon name="plus" size={18} /><span>New chat</span><kbd>⌘ K</kbd></button>
      <label className="search-box"><Icon name="search" size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations" /></label>
      <div className="side-section-label">YOUR SPACE <span>{conversations.length}</span></div>
      <div className="conversation-list">
        {filteredConversations.map(conversation => <div key={conversation.id} className={`conversation-row ${activeId === conversation.id ? 'selected' : ''}`}>
          {renamingId === conversation.id ? <form className="rename-form" onSubmit={e => { e.preventDefault(); void renameConversation(conversation.id) }}><input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setRenamingId('') }} /><button type="submit">Save</button></form> : <><button className="conversation-select" onClick={() => { setActiveId(conversation.id); setSidebarOpen(false) }}><Icon name="message" size={16} /><span>{conversation.title}</span></button><button className="conversation-more" aria-label="Conversation actions" onClick={() => setMenuId(menuId === conversation.id ? '' : conversation.id)}>···</button>{menuId === conversation.id && <div className="conversation-menu"><button onClick={() => { setRenameValue(conversation.title); setRenamingId(conversation.id); setMenuId('') }}><Icon name="edit" size={14} /> Rename</button><button className="danger-action" onClick={() => void deleteConversation(conversation.id)}><Icon name="trash" size={14} /> Delete</button></div>}</>}
        </div>)}
        {!filteredConversations.length && <p className="empty-search">{search ? 'No matching conversations' : 'Your conversations will appear here.'}</p>}
      </div>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Icon name="sparkle" size={18} /></div><strong>A little more magic</strong><p>Your ideas deserve room to grow.</p><button onClick={() => setPageError('You are already using the Nova AI workspace.')}>Explore Nova <span>↗</span></button></div><div className="profile-row"><div className="profile-avatar">{user.id.slice(0, 1).toUpperCase()}</div><div className="profile-info"><strong>Your account</strong><span>Personal workspace</span></div><button className="icon-button" onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><Icon name="logout" size={17} /></button></div></div>
    </aside>
    <section className="chat-panel">
      <header className="chat-header"><div className="chat-header-left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Icon name="menu" /></button><div className="model-badge"><span className="model-dot"><Icon name="sparkle" size={15} /></span><span>Nova Assistant</span><span className="model-pill">AI</span></div></div><div className="header-actions"><span className="secure-indicator"><i /> Private session</span><button className="icon-button theme-toggle" title="Toggle theme" aria-label="Toggle theme" onClick={() => setDark(!dark)}><Icon name="sun" size={18} /></button><button className="header-avatar" title="Account" onClick={() => void signOut()}>{user.id.slice(0, 1).toUpperCase()}</button></div></header>
      <div className={`chat-content ${messages.length ? 'has-messages' : ''}`}>
        {messages.length === 0 && !loading ? <div className="welcome-screen"><div className="welcome-symbol"><span className="welcome-ring ring-one" /><span className="welcome-ring ring-two" /><span className="welcome-center"><Icon name="sparkle" size={30} /></span><span className="welcome-twinkle twinkle-one">✦</span><span className="welcome-twinkle twinkle-two">✧</span></div><p className="welcome-overline">A LITTLE CURIOSITY GOES A LONG WAY</p><h1>What’s on your <span>mind?</span></h1><p className="welcome-description">A question, a challenge, a half-formed idea.<br />Let’s figure it out together.</p><div className="suggestion-grid"><button onClick={() => setDraft('Explain a complex idea in a simple way')}><span className="suggestion-icon lavender">✳</span><span><strong>Make it make sense</strong><small>Explain something complex</small></span><span className="suggestion-arrow">↗</span></button><button onClick={() => setDraft('Help me brainstorm creative ideas for a project')}><span className="suggestion-icon peach">✦</span><span><strong>Think outside the box</strong><small>Brainstorm fresh ideas</small></span><span className="suggestion-arrow">↗</span></button><button onClick={() => setDraft('Help me write a clear, compelling piece of text')}><span className="suggestion-icon mint">✎</span><span><strong>Find the right words</strong><small>Write, rewrite, refine</small></span><span className="suggestion-arrow">↗</span></button><button onClick={() => setDraft('Help me plan my next project step by step')}><span className="suggestion-icon blue">⌁</span><span><strong>Turn plans into action</strong><small>Map out your next steps</small></span><span className="suggestion-arrow">↗</span></button></div></div> : <div className="message-thread">
          {loading && messages.length === 0 && <div className="loading-line"><span className="spinner" /> Loading conversation…</div>}
          {messages.map(message => <article key={message.id} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}><div className={`message-avatar ${message.role === 'assistant' ? 'ai-avatar' : ''}`}>{message.role === 'assistant' ? <Icon name="sparkle" size={16} /> : user.id.slice(0, 1).toUpperCase()}</div><div className="message-body"><div className="message-author">{message.role === 'assistant' ? 'Nova' : 'You'} <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className="message-text">{message.content}</div></div></article>)}
          {sending && <article className="message assistant-message"><div className="message-avatar ai-avatar"><Icon name="sparkle" size={16} /></div><div className="message-body"><div className="message-author">Nova <span>thinking</span></div><div className="typing-indicator"><i /><i /><i /></div></div></article>}
          <div ref={bottomRef} />
        </div>}
      </div>
      {pageError && <div className="page-error" role="alert"><span>{pageError}</span><button onClick={() => setPageError('')} aria-label="Dismiss error"><Icon name="close" size={15} /></button></div>}
      <div className="composer-wrap"><form className="composer" onSubmit={sendMessage}><textarea ref={inputRef} rows={1} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleComposerKey} placeholder="Ask anything…" aria-label="Message Nova" /><div className="composer-bottom"><div className="composer-tools"><span className="composer-hint"><kbd>↵</kbd> to send <span>·</span> <kbd>shift + ↵</kbd> for a new line</span></div><button className="send-button" type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><Icon name="send" size={17} /></button></div></form><p className="disclaimer">Nova can make mistakes. Check important information.</p></div>
    </section>
  </main>
}

export default App
