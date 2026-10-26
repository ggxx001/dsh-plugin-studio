window.__ModuleLoader__.load({
  id: '@ggxx/dsh-plugin-studio',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback, useMemo, useRef } = React

    const SELF = '@ggxx/dsh-plugin-studio'
    const NS = 'dshPluginStudio'
    // Core bundles ship with the installation and are not a plugin to modify.
    const CORE = new Set(['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'])
    const COOKIE = 'dsh_plugin_studio_sessions'
    const STORAGE_KEY = 'dsh-plugin-studio:sessions:v1'
    const FACTS_ROUTE = '/api/plugin-studio/facts'
    const factsCache = new Map()

    // ------------------------------------------------------------------
    // Dictionaries
    // ------------------------------------------------------------------
    const zh = {
      tab: '会话工坊',
      title: '插件会话工坊',
      subtitle:
        '自己写过的插件直接回到当时的会话继续写；其它插件点开就是带上下文的修改会话，说明要改成什么即可。',
      refresh: '刷新',
      refreshing: '正在刷新…',
      loading: '正在读取插件库…',
      loadError: '读取插件库失败',
      retry: '重试',
      empty: '插件库里还没有可修改的插件。',
      noMatch: '没有匹配的插件。',
      search: '搜索插件名、包名或描述',
      statsInstalled: '已安装插件',
      statsSessions: '有修改会话',
      statsStale: '会话已失效',
      tagOn: '已启用',
      tagOff: '已停用',
      tagBuiltin: '内置',
      tagThird: '第三方',
      tagStale: '会话失效',
      tagError: '异常',
      rows: '个插件行',
      actionStart: '修改此插件',
      actionContinue: '继续修改',
      actionContinueWrite: '继续写',
      actionNew: '新会话',
      cardAria: '为这个插件打开修改会话',
      sessionLast: '上次会话',
      sessionWrote: '写它的会话',
      candidatesTitle: '可能写过它的会话',
      candidatesHint: '按会话标题和内容匹配。点一个直接接着写，不用重新建会话。',
      candidateOpen: '接着写',
      sessionMissing: '会话记录已失效，点开会重新建立。',
      modalKicker: '插件会话窗口',
      modalTitle: '修改会话',
      modalSub: '会话会带着这个插件的路径和插件行开始，之后在对话里继续提要求即可。',
      factsTitle: '插件信息',
      factPackage: '包名',
      factVersion: '版本',
      factStatus: '状态',
      factSource: '源码目录',
      factInstalled: '已安装位置',
      factPatch: '补丁文件',
      factProfile: 'Profile',
      factRows: '插件行',
      sourceUnknown: '未找到（可能随安装包内置）',
      sourceLoading: '正在解析…',
      registrySuffix: '注册表安装',
      registryNote:
        '这是注册表安装的副本，直接改不会持久。通常把它复制到工作区、改成 link 安装或做成新 bundle；说明里已让 Agent 先给方案。',
      briefLabel: '会话开场说明（可编辑）',
      briefHint: '这段说明会作为会话的第一条消息发送。可以直接在后面追加你的修改要求，或先精简它。',
      cancel: '取消',
      close: '关闭',
      start: '开始修改会话',
      starting: '正在创建会话…',
      continueLast: '继续上次会话',
      started: '已打开修改会话，接着在对话里说需求就行。',
      draftOpened: '已打开新会话，说明已经放进输入框，确认后发送。',
      continued: '已回到上次的修改会话。',
      continuedWriting: '已回到写这个插件的会话，接着说要改什么就行。',
      staleCleared: '上次会话已不可用，已清除记录并打开新窗口。',
      startFailed: '创建会话失败',
      promptFailed: '会话已建立，但开场说明没有发送成功',
      continueFailed: '打开会话失败',
      noRemote: '当前页面拿不到会话接口，请重开插件页面或重启应用。',
      noWorkspace: '当前页面拿不到会话导航接口，请重开插件页面或重启应用。',
      requestFailed: '请求失败',
      factsFailed: '插件路径读取失败，下面的说明仍可编辑并开始会话。',
      builtinNote: '内置插件的源码在安装包里，通常会新建一个本地 bundle 覆盖它。',
      refreshHint: '读取的是当前 Profile 的插件库；链接安装的插件会显示真实源码目录。',
    }

    const en = {
      tab: 'Sessions',
      title: 'Plugin Sessions',
      subtitle:
        'Plugins you wrote reopen in the session that wrote them; anything else opens a context-seeded modification session.',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      loading: 'Reading the plugin library…',
      loadError: 'Could not read the plugin library',
      retry: 'Retry',
      empty: 'No editable plugins in the plugin library yet.',
      noMatch: 'No plugin matches that search.',
      search: 'Search plugin name, package or description',
      statsInstalled: 'Installed plugins',
      statsSessions: 'With a session',
      statsStale: 'Stale sessions',
      tagOn: 'On',
      tagOff: 'Off',
      tagBuiltin: 'Built-in',
      tagThird: 'Third-party',
      tagStale: 'Stale',
      tagError: 'Error',
      rows: 'plugin rows',
      actionStart: 'Change this plugin',
      actionContinue: 'Continue',
      actionContinueWrite: 'Continue writing',
      actionNew: 'New session',
      cardAria: 'Open a modification session for this plugin',
      sessionLast: 'Last session',
      sessionWrote: 'Its session',
      candidatesTitle: 'Sessions that already worked on it',
      candidatesHint: 'Matched by session title and content. Pick one to keep going without creating a new session.',
      candidateOpen: 'Continue',
      sessionMissing: 'The recorded session is gone; opening it starts a new one.',
      modalKicker: 'Plugin session window',
      modalTitle: 'Modification session',
      modalSub:
        'The session starts with this plugin’s paths and rows, then you keep asking for changes in the conversation.',
      factsTitle: 'Plugin facts',
      factPackage: 'Package',
      factVersion: 'Version',
      factStatus: 'Status',
      factSource: 'Source',
      factInstalled: 'Installed at',
      factPatch: 'Patch',
      factProfile: 'Profile',
      factRows: 'Rows',
      sourceUnknown: 'Not found (packaged with the installation)',
      sourceLoading: 'Resolving…',
      registrySuffix: 'registry install',
      registryNote:
        'This is the registry-installed copy; editing it in place does not persist. The usual change is to copy it into the workspace and link it, or build a new bundle — the brief already asks the Agent for the plan.',
      briefLabel: 'Opening brief (editable)',
      briefHint:
        'This text is sent as the first message of the session. Append your concrete change request, or trim it first.',
      cancel: 'Cancel',
      close: 'Close',
      start: 'Start modification session',
      starting: 'Creating the session…',
      continueLast: 'Continue last session',
      started: 'Modification session opened; keep describing the change in the conversation.',
      draftOpened: 'New session opened with the brief in the composer; review it and send.',
      continued: 'Back in your last modification session.',
      continuedWriting: 'Back in the session that wrote this plugin; describe the next change there.',
      staleCleared: 'The recorded session is gone; its entry was cleared and the window reopened.',
      startFailed: 'Could not create the session',
      promptFailed: 'The session was created, but the opening brief could not be sent',
      continueFailed: 'Could not open the session',
      noRemote: 'The session interface is unavailable on this page. Reopen the Plugins page or restart the app.',
      noWorkspace: 'Session navigation is unavailable on this page. Reopen the Plugins page or restart the app.',
      requestFailed: 'Request failed',
      factsFailed: 'Could not read the plugin paths; the brief below is still editable and the session can start.',
      builtinNote: 'A built-in plugin ships inside the installation; the usual change is a local bundle that overrides it.',
      refreshHint:
        'This reads the current profile’s plugin library; link-installed plugins report their real source directory.',
    }

    const CSS = `
.dshs-page { box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; max-width: 980px; margin: 0 auto; padding: 18px 24px 48px; color: var(--dsw-alias-label-primary); font-size: 13px; }
.dshs-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.dshs-title { margin: 0 0 6px; font-size: 18px; line-height: 1.3; font-weight: 650; }
.dshs-sub { margin: 0; max-width: 680px; font-size: 12px; line-height: 1.65; color: var(--dsw-alias-label-secondary); }
.dshs-hint { margin: 0; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
.dshs-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 10px; }
.dshs-stat { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.dshs-stat b { font-size: 20px; line-height: 1.15; font-weight: 650; }
.dshs-stat span { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dshs-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshs-search { flex: 1 1 260px; min-width: 180px; box-sizing: border-box; padding: 8px 11px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
.dshs-search:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: -1px; }
.dshs-list { display: flex; flex-direction: column; gap: 10px; }
.dshs-card { box-sizing: border-box; display: flex; gap: 12px; width: 100%; padding: 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; text-align: start; cursor: pointer; }
.dshs-card:hover { border-color: var(--dsw-alias-border-l2); }
.dshs-card:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.dshs-icon { flex: none; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); font-size: 16px; font-weight: 700; }
.dshs-icon img { display: block; width: 100%; height: 100%; object-fit: cover; }
.dshs-main { display: flex; flex: 1; flex-direction: column; gap: 5px; min-width: 0; }
.dshs-name { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.dshs-name strong { font-size: 14px; font-weight: 650; overflow-wrap: anywhere; }
.dshs-pkg { font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.dshs-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
.dshs-tag { flex: none; padding: 3px 7px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; font-size: 10px; line-height: 1.2; white-space: nowrap; color: var(--dsw-alias-label-secondary); }
.dshs-tag.on { color: var(--dsw-alias-state-success-primary); }
.dshs-tag.off { color: var(--dsw-alias-state-idle-primary); }
.dshs-tag.builtin { color: var(--dsw-alias-state-warn-primary); }
.dshs-tag.third { color: var(--dsw-alias-brand-primary); }
.dshs-tag.err { color: var(--dsw-alias-state-error-primary); }
.dshs-session { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 3px; padding: 6px 9px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 11px; line-height: 1.4; color: var(--dsw-alias-label-secondary); }
.dshs-session b { font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.dshs-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.dshs-btn { appearance: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 1; white-space: nowrap; cursor: pointer; }
.dshs-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dshs-btn:disabled { opacity: .55; cursor: default; }
.dshs-btn.primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: #fff; }
.dshs-btn.primary:hover:not(:disabled) { background: var(--dsw-alias-brand-primary); filter: brightness(1.06); }
.dshs-btn:focus-visible, .dshs-iconbtn:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.dshs-empty { padding: 18px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 10px; text-align: center; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dshs-result { white-space: pre-wrap; overflow-wrap: anywhere; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
.dshs-result.ok { color: var(--dsw-alias-state-success-primary); }
.dshs-result.err { color: var(--dsw-alias-state-error-primary); }
.dshs-backdrop { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 32%, transparent); }
.dshs-modal { display: flex; flex-direction: column; width: min(700px, 100%); max-height: min(86vh, 820px); overflow: hidden; border: 1px solid var(--dsw-alias-border-l2); border-radius: 14px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 18px 50px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent); }
.dshs-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 16px 18px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dshs-kicker { margin-bottom: 4px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.dshs-modal-title { margin: 0; font-size: 17px; line-height: 1.3; font-weight: 650; }
.dshs-modal-sub { margin: 6px 0 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.dshs-iconbtn { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 18px; line-height: 1; cursor: pointer; }
.dshs-iconbtn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dshs-modal-body { display: flex; flex-direction: column; gap: 10px; padding: 14px 18px; overflow-y: auto; }
.dshs-facts { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.dshs-fact { display: flex; gap: 10px; font-size: 11.5px; line-height: 1.5; }
.dshs-fact span { flex: none; width: 74px; color: var(--dsw-alias-label-secondary); }
.dshs-fact b { min-width: 0; font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; font-weight: 450; overflow-wrap: anywhere; }
.dshs-label { margin-top: 2px; font-size: 12px; font-weight: 600; }
.dshs-textarea { box-sizing: border-box; width: 100%; min-height: 210px; resize: vertical; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; font-size: 12px; line-height: 1.6; }
.dshs-textarea:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: -1px; }
.dshs-modal-foot { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; padding: 12px 18px 16px; border-top: 1px solid var(--dsw-alias-border-l1); }
.dshs-candidates { display: flex; flex-direction: column; gap: 6px; }
.dshs-candidate { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; text-align: start; cursor: pointer; }
.dshs-candidate:hover:not(:disabled) { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.dshs-candidate:disabled { opacity: .55; cursor: default; }
.dshs-candidate:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.dshs-candidate-main { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.dshs-candidate-main b { min-width: 0; font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
.dshs-candidate-time { flex: none; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.dshs-candidate-snippet { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
@media (max-width: 620px) {
  .dshs-page { padding: 14px 14px 36px; }
  .dshs-card { padding: 12px; }
  .dshs-backdrop { padding: 10px; }
  .dshs-modal-body { padding: 12px; }
  .dshs-modal-head, .dshs-modal-foot { padding-inline: 12px; }
}
`

    // ------------------------------------------------------------------
    // Session ledger
    //
    // A cookie is host-scoped rather than port-scoped, so the plugin→session
    // mapping survives Desktop restarts that change the listening port.
    // ------------------------------------------------------------------
    function parseLedger(raw) {
      if (!raw) return {}
      try {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return {}
        const table = parsed.items && typeof parsed.items === 'object' ? parsed.items : parsed
        const result = {}
        for (const [name, entry] of Object.entries(table)) {
          if (typeof name !== 'string' || !entry || typeof entry !== 'object') continue
          if (typeof entry.id !== 'string' || entry.id === '') continue
          result[name] = {
            id: entry.id,
            title: typeof entry.title === 'string' ? entry.title : '',
            at: Number(entry.at) || 0,
          }
        }
        return result
      } catch {
        return {}
      }
    }

    function readLedger() {
      let merged = {}
      try {
        merged = parseLedger(window.localStorage?.getItem(STORAGE_KEY))
      } catch {
        /* storage unavailable */
      }
      try {
        const prefix = COOKIE + '='
        const found = String(document.cookie || '')
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith(prefix))
        if (found) {
          const fromCookie = parseLedger(decodeURIComponent(found.slice(prefix.length)))
          merged = { ...fromCookie, ...merged }
        }
      } catch {
        /* cookies unavailable */
      }
      return merged
    }

    function writeLedger(table) {
      const items = {}
      const entries = Object.entries(table)
        .sort((left, right) => (right[1]?.at || 0) - (left[1]?.at || 0))
        .slice(0, 60)
      for (const [name, entry] of entries) {
        items[name] = { id: entry.id, title: entry.title || '', at: entry.at || 0 }
      }
      const serialized = JSON.stringify({ v: 1, items })
      try {
        window.localStorage?.setItem(STORAGE_KEY, serialized)
      } catch {
        /* storage unavailable: the cookie below is the fallback */
      }
      try {
        document.cookie =
          COOKIE + '=' + encodeURIComponent(serialized) + '; path=/; max-age=31536000; SameSite=Lax'
      } catch {
        /* cookies unavailable: keep the in-memory ledger for this page */
      }
    }

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    function localized(value, language) {
      if (value == null) return ''
      if (typeof value === 'string') return value
      if (typeof value !== 'object') return ''
      const exact = value[language]
      if (typeof exact === 'string' && exact) return exact
      for (const key of language === 'zh' ? ['zh', 'zh-CN', 'zh-TW'] : ['en', 'en-US']) {
        if (typeof value[key] === 'string' && value[key]) return value[key]
      }
      const first = Object.values(value).find((entry) => typeof entry === 'string' && entry)
      return typeof first === 'string' ? first : ''
    }

    function displayName(bundle, language) {
      return localized(bundle?.meta?.title, language) || bundle?.name || ''
    }

    function initialOf(bundle) {
      const text = String(bundle?.name || '?')
      const tail = text.includes('/') ? text.slice(text.lastIndexOf('/') + 1) : text
      return (tail[0] || '?').toUpperCase()
    }

    function baseNameOf(packageName) {
      const text = String(packageName || '')
      const slash = text.lastIndexOf('/')
      return slash >= 0 ? text.slice(slash + 1) : text
    }

    /** Character bigrams, ignoring spaces and punctuation, for loose title matching. */
    function gramsOf(text) {
      const clean = String(text || '')
        .toLowerCase()
        .replace(/[\s\p{P}\p{S}]+/gu, '')
      const grams = new Set()
      for (let index = 0; index < clean.length - 1; index += 1) grams.add(clean.slice(index, index + 2))
      return grams
    }

    /**
     * How strongly a session title names this plugin: shared bigrams with the
     * plugin title, English title, or package basename. 2+ is a real match.
     */
    function titleAffinity(title, bundle, language) {
      const titleGrams = gramsOf(title)
      if (titleGrams.size === 0) return 0
      const candidates = [displayName(bundle, 'zh'), displayName(bundle, 'en'), baseNameOf(bundle?.name)].filter(
        (value) => typeof value === 'string' && value.length >= 2,
      )
      let best = 0
      for (const candidate of candidates) {
        const grams = gramsOf(candidate)
        let shared = 0
        for (const gram of grams) if (titleGrams.has(gram)) shared += 1
        if (shared > best) best = shared
      }
      return best
    }

    function textOf(error) {
      if (!error) return ''
      if (typeof error === 'string') return error
      return String(error.message || error.code || error)
    }

    function makeRequestId() {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      } catch {
        /* fall through */
      }
      return 'studio-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
    }

    function timeZoneOf() {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return undefined
      }
    }

    function relativeTime(at, language, t) {
      if (!at) return ''
      const delta = Date.now() - at
      const minute = 60_000
      const hour = 60 * minute
      const day = 24 * hour
      try {
        const format = new Intl.RelativeTimeFormat(language === 'zh' ? 'zh-CN' : 'en', { numeric: 'auto' })
        if (delta < minute) return format.format(0, 'minute')
        if (delta < hour) return format.format(-Math.round(delta / minute), 'minute')
        if (delta < day) return format.format(-Math.round(delta / hour), 'hour')
        return format.format(-Math.round(delta / day), 'day')
      } catch {
        return new Date(at).toLocaleString()
      }
    }

    /** Build the opening brief the session starts with. */
    function buildBrief(bundle, facts, language) {
      const rows = (bundle?.rows || []).map((row) => row?.rowId).filter(Boolean)
      const title = displayName(bundle, language)
      const pkg = String(bundle?.name || '') + (bundle?.version ? '@' + bundle.version : '')
      const mode = facts?.sourceDir ? 'source' : facts?.installedDir ? 'registry' : 'builtin'
      if (language === 'zh') {
        return [
          '【插件修改会话】',
          '',
          '我要在这个会话里继续修改一个已安装的 DSH 插件，请把这里当作它的长期修改现场。',
          '',
          '插件：' + title,
          '包名：' + pkg,
          '状态：' + (bundle?.enabled ? '已启用' : '已停用') + ' · ' + (bundle?.official ? '官方/内置' : '第三方'),
          rows.length > 0 ? '插件行：' + rows.join('、') : null,
          mode === 'source'
            ? '源码目录（可直接改）：' + facts.sourceDir
            : mode === 'registry'
              ? '已安装位置：' + facts.installedDir + '（注册表安装的副本，只读参考）'
              : '源码目录：未找到（随安装包内置）',
          facts?.patchPath ? '补丁文件：' + facts.patchPath : null,
          facts?.profileDir ? 'Profile：' + facts.profileDir : null,
          '',
          '请先不要改动任何文件，先做三件事：',
          '1. ' +
            (mode === 'source'
              ? '读源码目录里的 package.json、cordis.patch.yml、index.js、client.js，用几句话说明它现在做什么，Host 端和 Client 端各负责什么。'
              : mode === 'registry'
                ? '说明这是注册表安装的副本：要持久修改，通常把它复制到工作区并改成 link 安装，或新建一个覆盖它的 bundle；列出可行路径。'
                : '说明这种内置插件通常怎么改（新建本地 bundle 覆盖、改配置或换插槽），并列出可行路径。'),
          '2. ' +
            (mode === 'source'
              ? '指出这次修改最可能落在哪里（插件行 id、插槽、组件、配置项）。'
              : '指出覆盖或重装它最合适的位置。'),
          '3. 问我这次具体想改成什么。',
          '',
          '等我说明需求后再动手。改完用 plugin_manager 的 install_bundle 重装这个插件目录；替换已安装的包之后，浏览器端代码可能需要重启才能加载。',
        ]
          .filter(Boolean)
          .join('\n')
      }
      return [
        '[Plugin modification session]',
        '',
        'I want to keep modifying an installed DSH plugin in this session; treat it as the long-lived workspace for this plugin.',
        '',
        'Plugin: ' + title,
        'Package: ' + pkg,
        'State: ' + (bundle?.enabled ? 'enabled' : 'disabled') + ' · ' + (bundle?.official ? 'official/built-in' : 'third-party'),
        rows.length > 0 ? 'Rows: ' + rows.join(', ') : null,
        mode === 'source'
          ? 'Source (editable): ' + facts.sourceDir
          : mode === 'registry'
            ? 'Installed at: ' + facts.installedDir + ' (registry copy, read-only reference)'
            : 'Source: not found (packaged with the installation)',
        facts?.patchPath ? 'Patch: ' + facts.patchPath : null,
        facts?.profileDir ? 'Profile: ' + facts.profileDir : null,
        '',
        'Do not change any files yet. First do three things:',
        '1. ' +
          (mode === 'source'
            ? 'Read package.json, cordis.patch.yml, index.js and client.js in the source directory, then describe in a few sentences what the plugin does and how the Host and Client halves split the work.'
            : mode === 'registry'
              ? 'Explain that this is the registry-installed copy: a lasting change usually means copying it into the workspace and linking it, or building a bundle that overrides it; list the viable paths.'
              : 'Explain how a built-in like this is normally changed (a local overriding bundle, configuration, or a replacement slot) and list the viable paths.'),
        '2. ' +
          (mode === 'source'
            ? 'Point at where this change most likely lands (row id, slot, component, or config).'
            : 'Point at the best place to override or reinstall it.'),
        '3. Ask me what exactly I want changed.',
        '',
        'Wait for my request before editing. When the change is done, reinstall this plugin directory with plugin_manager install_bundle; replacing an installed package may require a restart before the new browser code loads.',
      ]
        .filter(Boolean)
        .join('\n')
    }

    // ------------------------------------------------------------------
    // React surface
    // ------------------------------------------------------------------
    return {
      inject: [
        'slots',
        'locale',
        'remote',
        'remote.pluginManager',
        'remote.session',
        'sessions',
        'workspaces',
        'uiWorkspace',
      ],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'plugin-studio: dictionaries')
        const t = ctx.locale.bind(NS)

        function language() {
          try {
            const snapshot = ctx.locale.getLocale?.() ?? ctx.locale.getSnapshot?.()
            const id = String(snapshot?.active || snapshot?.id || snapshot?.locale || 'en').toLowerCase()
            return id.startsWith('zh') ? 'zh' : 'en'
          } catch {
            return 'en'
          }
        }

        function service(name) {
          try {
            const value = ctx.get(name)
            if (value !== undefined && value !== null) return value
          } catch {
            /* not reachable through get() */
          }
          try {
            return ctx[name]
          } catch {
            return undefined
          }
        }

        async function remoteCall(namespace, method, ...args) {
          const face = ctx.remote?.[namespace]
          if (!face || typeof face[method] !== 'function') throw new Error(t('noRemote'))
          const answer = await face[method](...args)
          if (!answer || answer.ok !== true) {
            const detail = answer?.error
            const code = detail?.code ? String(detail.code) + ': ' : ''
            throw new Error(code + String(detail?.message || t('requestFailed')))
          }
          return answer.value
        }

        function factsOf(name) {
          const cached = factsCache.get(name)
          if (cached !== undefined) return cached
          const pending = fetch(FACTS_ROUTE, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name }),
          }).then(async (response) => {
            let body = null
            try {
              body = await response.json()
            } catch {
              body = null
            }
            if (!response.ok || body?.ok !== true) {
              throw new Error(body?.error?.message || 'HTTP ' + response.status)
            }
            return body.value
          })
          factsCache.set(name, pending)
          pending.catch(() => {
            if (factsCache.get(name) === pending) factsCache.delete(name)
          })
          return pending
        }

        function workspaceService() {
          return service('uiWorkspace')
        }

        function pickWorkspaceId() {
          try {
            const workspaces = service('workspaces')?.list?.getSnapshot?.()
            const sessions = service('sessions')?.list?.getSnapshot?.()
            const items = Array.isArray(workspaces?.items) ? workspaces.items : []
            if (items.length === 0) return undefined
            const archived = new Set(Array.isArray(workspaces?.archivedSessionIds) ? workspaces.archivedSessionIds : [])
            let best = undefined
            let bestTime = -1
            for (const item of items) {
              const ids = Array.isArray(item?.sessionIds) ? item.sessionIds : []
              for (const id of ids) {
                if (archived.has(id)) continue
                const time = Number(sessions?.byId?.[id]?.updatedAt || 0)
                if (time > bestTime) {
                  bestTime = time
                  best = item?.workspaceId
                }
              }
            }
            return best ?? items.find((item) => item?.workspaceId)?.workspaceId
          } catch {
            return undefined
          }
        }

        /** Live session ids plus the latest session id per title, from the Client list. */
        function sessionIndex() {
          const result = { ids: null, titles: new Map() }
          try {
            const byId = service('sessions')?.list?.getSnapshot?.()?.byId
            if (byId && typeof byId === 'object') {
              const ids = new Set()
              for (const [id, summary] of Object.entries(byId)) {
                if (!summary) continue
                ids.add(id)
                const title =
                  typeof summary.title === 'string' ? summary.title : summary?.projectionValues?.title
                if (typeof title === 'string' && title !== '') {
                  const at = Number(summary.updatedAt) || 0
                  const previous = result.titles.get(title)
                  if (!previous || at > previous.at) result.titles.set(title, { id, at })
                }
              }
              result.ids = ids
            }
          } catch {
            /* the list is not ready yet */
          }
          return result
        }

        async function createSession(workspaceId) {
          const sessions = service('sessions')
          if (sessions && typeof sessions.create === 'function') {
            try {
              const id = await sessions.create({ workspaceId })
              if (typeof id === 'string' && id !== '') return id
            } catch {
              /* fall back to the generated Remote below */
            }
          }
          const value = await remoteCall('session', 'create', { workspaceId })
          const id = value?.sessionId
          if (typeof id !== 'string' || id === '') throw new Error(t('requestFailed'))
          return id
        }

        function openSessionById(sessionId) {
          const ui = workspaceService()
          if (!ui || typeof ui.openSession !== 'function') throw new Error(t('noWorkspace'))
          ui.openSession(sessionId)
        }

        function openDraft(brief) {
          const ui = workspaceService()
          if (!ui || typeof ui.startSession !== 'function') throw new Error(t('noWorkspace'))
          ui.startSession(undefined, { prompt: brief, clearPreviousDraft: false })
          return { mode: 'draft', warning: null }
        }

        function sessionTitle(bundle) {
          const label = displayName(bundle, language())
          return (language() === 'zh' ? '改插件 · ' : 'Edit plugin · ') + label
        }

        function StudyPage() {
          const [tick, setTick] = useState(0)
          const [reloadToken, setReloadToken] = useState(0)
          const [state, setState] = useState({
            status: 'loading',
            bundles: [],
            liveSessions: null,
            titleIndex: new Map(),
            error: null,
          })
          const [query, setQuery] = useState('')
          const [ledger, setLedger] = useState(() => readLedger())
          const [active, setActive] = useState(null)
          const [busy, setBusy] = useState(null)
          const [notice, setNotice] = useState(null)
          const [factsMap, setFactsMap] = useState({})
          const briefRef = useRef(null)

          useEffect(() => {
            const offLocale = ctx.locale.subscribe(() => setTick((value) => value + 1))
            return () => offLocale()
          }, [])

          // Keep the title → session index in step with the Client list; it also
          // recovers a lost ledger entry from the session title this plugin writes.
          useEffect(() => {
            const source = service('sessions')?.list
            if (!source || typeof source.subscribe !== 'function') return undefined
            const sync = () => {
              const index = sessionIndex()
              setState((current) => ({
                ...current,
                liveSessions: index.ids ?? current.liveSessions,
                titleIndex: index.titles,
              }))
            }
            sync()
            return source.subscribe(sync)
          }, [])

          useEffect(() => {
            let cancelled = false
            const run = async () => {
              setState((current) => ({
                ...current,
                status: current.bundles.length > 0 ? 'refreshing' : 'loading',
                error: null,
              }))
              try {
                const bundles = await remoteCall('pluginManager', 'listBundles')
                const index = sessionIndex()
                let live = index.ids
                if (!live) {
                  try {
                    const listed = await remoteCall('session', 'list', {})
                    const items = Array.isArray(listed?.items) ? listed.items : []
                    live = new Set(items.map((item) => item?.sessionId).filter(Boolean))
                  } catch {
                    live = null
                  }
                }
                if (!cancelled) {
                  setState({
                    status: 'ready',
                    bundles: Array.isArray(bundles) ? bundles : [],
                    liveSessions: live,
                    titleIndex: index.titles,
                    error: null,
                  })
                }
              } catch (error) {
                if (!cancelled) {
                  setState((current) => ({ ...current, status: 'error', error: textOf(error) }))
                }
              }
            }
            run()
            return () => {
              cancelled = true
            }
          }, [reloadToken])

          useEffect(() => {
            if (!notice) return undefined
            const timer = setTimeout(() => setNotice(null), 7000)
            return () => clearTimeout(timer)
          }, [notice])

          const windowOpen = active !== null

          useEffect(() => {
            if (!windowOpen) return undefined
            const onKeyDown = (event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                setActive(null)
              }
            }
            window.addEventListener('keydown', onKeyDown)
            const focusTimer = setTimeout(() => {
              try {
                briefRef.current?.focus()
              } catch {
                /* focus is best-effort */
              }
            }, 30)
            return () => {
              window.removeEventListener('keydown', onKeyDown)
              clearTimeout(focusTimer)
            }
          }, [windowOpen])

          const languageId = language()

          const installed = useMemo(() => {
            const list = (state.bundles || [])
              .filter((bundle) => bundle && bundle.name !== SELF && !CORE.has(bundle.name))
              .filter((bundle) => bundle.availability === 'installation' || bundle.installed === true)
              .filter((bundle) => !(bundle.error?.code === 'not-bundle' && (bundle.rows?.length || 0) === 0))
            const seen = new Set()
            return list
              .filter((bundle) => {
                if (seen.has(bundle.name)) return false
                seen.add(bundle.name)
                return true
              })
              .sort((left, right) => {
                const official = Number(left.official === true) - Number(right.official === true)
                if (official !== 0) return official
                return displayName(left, languageId).localeCompare(displayName(right, languageId))
              })
          }, [state.bundles, languageId, tick])

          const visible = useMemo(() => {
            const needle = query.trim().toLowerCase()
            if (!needle) return installed
            return installed.filter((bundle) => {
              const haystack = [
                bundle.name,
                displayName(bundle, languageId),
                localized(bundle?.meta?.description, languageId),
                localized(bundle?.description, languageId),
                ...(bundle.rows || []).map((row) => row?.rowId || ''),
              ]
                .join(' ')
                .toLowerCase()
              return haystack.includes(needle)
            })
          }, [installed, query, languageId, tick])

          const profilePlugins = useMemo(
            () => installed.filter((bundle) => bundle.availability === 'profile'),
            [installed],
          )

          /** Resolve each profile plugin's source once; the window then opens instantly. */
          useEffect(() => {
            if (state.status !== 'ready' || profilePlugins.length === 0) return undefined
            let cancelled = false
            let cursor = 0
            const worker = async () => {
              while (!cancelled) {
                const index = cursor
                cursor += 1
                if (index >= profilePlugins.length) return
                const bundle = profilePlugins[index]
                try {
                  const facts = await factsOf(bundle.name)
                  if (cancelled) return
                  setFactsMap((current) =>
                    current[bundle.name] === undefined ? { ...current, [bundle.name]: facts } : current,
                  )
                } catch {
                  /* discovery is best-effort */
                }
              }
            }
            worker()
            worker()
            worker()
            return () => {
              cancelled = true
            }
          }, [state.status, profilePlugins])

          /**
           * Sessions that already wrote an editable plugin, matched by title.
           * They are the ones a "continue writing" click opens directly.
           */
          const discovered = useMemo(() => {
            const byId = service('sessions')?.list?.getSnapshot?.()?.byId || {}
            const sessions = []
            for (const [id, summary] of Object.entries(byId)) {
              if (!summary || summary.blank === true) continue
              const title = typeof summary.title === 'string' ? summary.title : ''
              if (!title || title.startsWith('改插件 · ') || title.startsWith('Edit plugin · ')) continue
              sessions.push({ id, title, at: Number(summary.updatedAt) || 0 })
            }
            const result = {}
            for (const bundle of profilePlugins) {
              if (!factsMap[bundle.name]?.sourceDir) continue
              const scored = []
              for (const session of sessions) {
                const affinity = titleAffinity(session.title, bundle, languageId)
                if (affinity >= 2) scored.push({ ...session, affinity })
              }
              scored.sort((left, right) => right.affinity - left.affinity || right.at - left.at)
              if (scored.length > 0) result[bundle.name] = scored.slice(0, 5)
            }
            return result
          }, [profilePlugins, factsMap, state.titleIndex, state.liveSessions, languageId, tick])

          const entryOf = useCallback(
            (bundle) => {
              const stored = ledger[bundle.name]
              if (stored) return stored
              const name = displayName(bundle, languageId)
              for (const title of ['改插件 · ' + name, 'Edit plugin · ' + name]) {
                const hit = state.titleIndex?.get(title)
                if (hit) return { id: hit.id, title, at: hit.at }
              }
              return undefined
            },
            [ledger, state.titleIndex, languageId],
          )

          const sessionCount = useMemo(
            () => installed.filter((bundle) => entryOf(bundle)).length,
            [installed, entryOf],
          )
          const staleCount = useMemo(() => {
            if (!state.liveSessions) return 0
            return installed.filter((bundle) => {
              const entry = entryOf(bundle)
              return entry && !state.liveSessions.has(entry.id)
            }).length
          }, [installed, entryOf, state.liveSessions])

          const isLive = useCallback(
            (entry) => Boolean(entry) && (!state.liveSessions || state.liveSessions.has(entry.id)),
            [state.liveSessions],
          )

          const remember = useCallback((bundle, sessionId, title) => {
            const next = {
              ...readLedger(),
              [bundle.name]: { id: sessionId, title: title || '', at: Date.now() },
            }
            writeLedger(next)
            setLedger(next)
          }, [])

          const forget = useCallback((name) => {
            const next = readLedger()
            delete next[name]
            writeLedger(next)
            setLedger(next)
          }, [])

          const continueSession = useCallback(
            (bundle, entry) => {
              try {
                openSessionById(entry.id)
                setNotice({ kind: 'ok', text: t('continued') })
              } catch (error) {
                setNotice({ kind: 'error', text: t('continueFailed') + ': ' + textOf(error) })
              }
            },
            [],
          )

          const openWindow = useCallback(
            async (bundle) => {
              const known = factsMap[bundle.name]
              setActive({
                bundle,
                facts: known ?? null,
                factsState: known ? 'ready' : 'loading',
                brief: known ? buildBrief(bundle, known, language()) : '',
                touched: false,
                error: null,
              })
              if (known) return
              try {
                const facts = await factsOf(bundle.name)
                setActive((current) => {
                  if (!current || current.bundle.name !== bundle.name) return current
                  return {
                    ...current,
                    facts,
                    factsState: 'ready',
                    brief: current.touched ? current.brief : buildBrief(bundle, facts, language()),
                  }
                })
              } catch (error) {
                setActive((current) => {
                  if (!current || current.bundle.name !== bundle.name) return current
                  return {
                    ...current,
                    factsState: 'failed',
                    error: t('factsFailed') + ' · ' + textOf(error),
                    brief: current.touched ? current.brief : buildBrief(bundle, null, language()),
                  }
                })
              }
            },
            [factsMap],
          )

          const openKnown = useCallback(
            (bundle, session) => {
              try {
                remember(bundle, session.id, session.title)
                openSessionById(session.id)
                setNotice({ kind: 'ok', text: t('continuedWriting') })
              } catch (error) {
                setNotice({ kind: 'error', text: t('continueFailed') + ': ' + textOf(error) })
              }
            },
            [remember],
          )

          const primary = useCallback(
            (bundle) => {
              const entry = entryOf(bundle)
              if (entry && isLive(entry)) {
                continueSession(bundle, entry)
                return
              }
              if (entry) {
                forget(bundle.name)
                setNotice({ kind: 'warn', text: t('staleCleared') })
              }
              const candidate = discovered[bundle.name]?.[0]
              if (candidate) {
                openKnown(bundle, candidate)
                return
              }
              openWindow(bundle)
            },
            [entryOf, isLive, discovered, continueSession, forget, openKnown, openWindow],
          )

          const startSession = useCallback(async () => {
            if (!active || busy === 'start') return
            const bundle = active.bundle
            const brief = active.brief.trim() || buildBrief(bundle, active.facts, language())
            setBusy('start')
            setNotice(null)
            try {
              const workspaceId = pickWorkspaceId()
              if (!workspaceId) {
                const draft = openDraft(brief)
                setActive(null)
                setNotice({ kind: 'ok', text: t('draftOpened') })
                return draft
              }
              let sessionId
              try {
                sessionId = await createSession(workspaceId)
              } catch {
                const draft = openDraft(brief)
                setActive(null)
                setNotice({ kind: 'ok', text: t('draftOpened') })
                return draft
              }
              let warning = null
              try {
                await remoteCall('session', 'prompt', {
                  requestId: makeRequestId(),
                  sessionId,
                  mode: 'queue',
                  content: [{ type: 'text', text: brief }],
                  clientTimeZone: timeZoneOf(),
                })
              } catch (error) {
                warning = t('promptFailed') + ': ' + textOf(error)
              }
              const title = sessionTitle(bundle)
              try {
                await remoteCall('session', 'rename', { sessionId, title })
              } catch {
                /* the title is cosmetic */
              }
              remember(bundle, sessionId, title)
              setActive(null)
              openSessionById(sessionId)
              setNotice(warning ? { kind: 'error', text: warning } : { kind: 'ok', text: t('started') })
            } catch (error) {
              setNotice({ kind: 'error', text: t('startFailed') + ': ' + textOf(error) })
            } finally {
              setBusy(null)
            }
          }, [active, busy, remember])

          function card(bundle) {
            const entry = entryOf(bundle)
            const live = isLive(entry)
            const candidate = !(entry && live) ? discovered[bundle.name]?.[0] : undefined
            const title = displayName(bundle, languageId)
            const description =
              localized(bundle?.meta?.description, languageId) || localized(bundle?.description, languageId)
            const icon = bundle?.meta?.icon
            const rows = bundle.rows?.length || 0
            return h(
              'div',
              {
                key: bundle.name,
                className: 'dshs-card',
                role: 'button',
                tabIndex: 0,
                'aria-label': t('cardAria') + ': ' + title,
                onClick: () => primary(bundle),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    primary(bundle)
                  }
                },
              },
              h(
                'div',
                { className: 'dshs-icon', 'aria-hidden': true },
                icon ? h('img', { src: icon, alt: '', loading: 'lazy' }) : h('span', null, initialOf(bundle)),
              ),
              h(
                'div',
                { className: 'dshs-main' },
                h(
                  'div',
                  { className: 'dshs-name' },
                  h('strong', null, title),
                  h(
                    'span',
                    { className: 'dshs-tag ' + (bundle.official ? 'builtin' : 'third') },
                    bundle.official ? t('tagBuiltin') : t('tagThird'),
                  ),
                  h(
                    'span',
                    { className: 'dshs-tag ' + (bundle.enabled ? 'on' : 'off') },
                    bundle.enabled ? t('tagOn') : t('tagOff'),
                  ),
                  bundle.error ? h('span', { className: 'dshs-tag err' }, t('tagError')) : null,
                  entry && !live ? h('span', { className: 'dshs-tag err' }, t('tagStale')) : null,
                ),
                h(
                  'div',
                  { className: 'dshs-pkg' },
                  String(bundle.name) +
                    (bundle.version ? ' · v' + bundle.version : '') +
                    ' · ' +
                    rows +
                    ' ' +
                    t('rows'),
                ),
                description ? h('div', { className: 'dshs-desc' }, description) : null,
                entry && live
                  ? h(
                      'div',
                      { className: 'dshs-session' },
                      h('span', null, t('sessionLast')),
                      h('b', null, entry.title || entry.id),
                      h('span', null, '· ' + relativeTime(entry.at, languageId, t)),
                    )
                  : candidate
                    ? h(
                        'div',
                        { className: 'dshs-session' },
                        h('span', null, t('sessionWrote')),
                        h('b', null, candidate.title || candidate.id),
                        h('span', null, '· ' + relativeTime(candidate.at, languageId, t)),
                      )
                    : null,
                h(
                  'div',
                  { className: 'dshs-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshs-btn primary',
                      onClick: (event) => {
                        event.stopPropagation()
                        primary(bundle)
                      },
                    },
                    entry && live ? t('actionContinue') : candidate ? t('actionContinueWrite') : t('actionStart'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshs-btn',
                      onClick: (event) => {
                        event.stopPropagation()
                        openWindow(bundle)
                      },
                    },
                    t('actionNew'),
                  ),
                ),
              ),
            )
          }

          const modal =
            active === null
              ? null
              : h(
                  'div',
                  {
                    className: 'dshs-backdrop',
                    onMouseDown: (event) => {
                      if (event.target === event.currentTarget && busy !== 'start') setActive(null)
                    },
                  },
                  h(
                    'div',
                    {
                      className: 'dshs-modal',
                      role: 'dialog',
                      'aria-modal': 'true',
                      'aria-labelledby': 'dshs-modal-title',
                    },
                    h(
                      'div',
                      { className: 'dshs-modal-head' },
                      h(
                        'div',
                        null,
                        h('div', { className: 'dshs-kicker' }, t('modalKicker')),
                        h('h2', { className: 'dshs-modal-title', id: 'dshs-modal-title' }, t('modalTitle')),
                        h(
                          'p',
                          { className: 'dshs-modal-sub' },
                          displayName(active.bundle, languageId) + ' · ' + active.bundle.name,
                        ),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dshs-iconbtn',
                          'aria-label': t('close'),
                          disabled: busy === 'start',
                          onClick: () => setActive(null),
                        },
                        '×',
                      ),
                    ),
                    h(
                      'div',
                      { className: 'dshs-modal-body' },
                      h(
                        'div',
                        { className: 'dshs-facts' },
                        h(
                          'div',
                          { className: 'dshs-fact' },
                          h('span', null, t('factPackage')),
                          h('b', null, active.bundle.name),
                        ),
                        active.bundle.version
                          ? h(
                              'div',
                              { className: 'dshs-fact' },
                              h('span', null, t('factVersion')),
                              h('b', null, 'v' + active.bundle.version),
                            )
                          : null,
                        h(
                          'div',
                          { className: 'dshs-fact' },
                          h('span', null, t('factStatus')),
                          h(
                            'b',
                            null,
                            (active.bundle.enabled ? t('tagOn') : t('tagOff')) +
                              ' · ' +
                              (active.bundle.official ? t('tagBuiltin') : t('tagThird')),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'dshs-fact' },
                          h('span', null, t('factSource')),
                          h(
                            'b',
                            null,
                            active.facts?.sourceDir
                              ? active.facts.sourceDir
                              : active.facts?.installedDir
                                ? active.facts.installedDir + ' · ' + t('registrySuffix')
                                : active.factsState === 'loading'
                                  ? t('sourceLoading')
                                  : t('sourceUnknown'),
                          ),
                        ),
                        active.facts?.patchPath
                          ? h(
                              'div',
                              { className: 'dshs-fact' },
                              h('span', null, t('factPatch')),
                              h('b', null, active.facts.patchPath),
                            )
                          : null,
                        active.facts?.profileDir
                          ? h(
                              'div',
                              { className: 'dshs-fact' },
                              h('span', null, t('factProfile')),
                              h('b', null, active.facts.profileDir),
                            )
                          : null,
                      ),
                      (discovered[active.bundle.name] || []).length > 0
                        ? h(
                            'div',
                            { className: 'dshs-candidates' },
                            h('div', { className: 'dshs-label' }, t('candidatesTitle')),
                            h('p', { className: 'dshs-hint' }, t('candidatesHint')),
                            (discovered[active.bundle.name] || []).map((session) =>
                              h(
                                'button',
                                {
                                  key: session.id,
                                  type: 'button',
                                  className: 'dshs-candidate',
                                  disabled: busy === 'start',
                                  onClick: () => {
                                    setActive(null)
                                    openKnown(active.bundle, session)
                                  },
                                },
                                h(
                                  'span',
                                  { className: 'dshs-candidate-main' },
                                  h('b', null, session.title || session.id),
                                  h(
                                    'span',
                                    { className: 'dshs-candidate-time' },
                                    relativeTime(session.at, languageId, t),
                                  ),
                                ),
                                session.snippet
                                  ? h('span', { className: 'dshs-candidate-snippet' }, session.snippet)
                                  : null,
                              ),
                            ),
                          )
                        : null,
                      !active.facts?.sourceDir && active.factsState === 'ready'
                        ? h(
                            'p',
                            { className: 'dshs-hint' },
                            active.facts?.installedDir ? t('registryNote') : t('builtinNote'),
                          )
                        : null,
                      h('label', { className: 'dshs-label', htmlFor: 'dshs-brief' }, t('briefLabel')),
                      h('textarea', {
                        id: 'dshs-brief',
                        ref: briefRef,
                        className: 'dshs-textarea',
                        value: active.brief,
                        rows: 10,
                        spellCheck: false,
                        disabled: busy === 'start',
                        onChange: (event) =>
                          setActive((current) =>
                            current ? { ...current, brief: event.target.value, touched: true } : current,
                          ),
                      }),
                      h('p', { className: 'dshs-hint' }, t('briefHint')),
                      active.error ? h('div', { className: 'dshs-result err' }, active.error) : null,
                    ),
                    h(
                      'div',
                      { className: 'dshs-modal-foot' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dshs-btn',
                          disabled: busy === 'start',
                          onClick: () => setActive(null),
                        },
                        t('cancel'),
                      ),
                      entryOf(active.bundle) && isLive(entryOf(active.bundle))
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshs-btn',
                              disabled: busy === 'start',
                              onClick: () => {
                                const entry = entryOf(active.bundle)
                                setActive(null)
                                continueSession(active.bundle, entry)
                              },
                            },
                            t('continueLast'),
                          )
                        : null,
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dshs-btn primary',
                          disabled: busy === 'start' || active.factsState === 'loading',
                          onClick: startSession,
                        },
                        busy === 'start' ? t('starting') : t('start'),
                      ),
                    ),
                  ),
                )

          return h(
            'div',
            { className: 'dshs-page' },
            h('style', { key: 'plugin-studio-style' }, CSS),
            h(
              'div',
              { className: 'dshs-head' },
              h(
                'div',
                null,
                h('h2', { className: 'dshs-title' }, t('title')),
                h('p', { className: 'dshs-sub' }, t('subtitle')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshs-btn',
                  disabled: state.status === 'loading' || state.status === 'refreshing',
                  onClick: () => setReloadToken((value) => value + 1),
                },
                state.status === 'refreshing' ? t('refreshing') : t('refresh'),
              ),
            ),
            h(
              'div',
              { className: 'dshs-stats' },
              h(
                'div',
                { className: 'dshs-stat' },
                h('b', null, String(installed.length)),
                h('span', null, t('statsInstalled')),
              ),
              h(
                'div',
                { className: 'dshs-stat' },
                h('b', null, String(sessionCount)),
                h('span', null, t('statsSessions')),
              ),
              h(
                'div',
                { className: 'dshs-stat' },
                h('b', null, String(staleCount)),
                h('span', null, t('statsStale')),
              ),
            ),
            notice
              ? h(
                  'div',
                  {
                    className:
                      'dshs-result ' + (notice.kind === 'error' ? 'err' : notice.kind === 'ok' ? 'ok' : ''),
                  },
                  notice.text,
                )
              : null,
            state.status === 'error'
              ? h(
                  'div',
                  { className: 'dshs-result err' },
                  t('loadError') + ': ' + (state.error || ''),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshs-btn',
                      style: { marginInlineStart: 10 },
                      onClick: () => setReloadToken((value) => value + 1),
                    },
                    t('retry'),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'dshs-toolbar' },
              h('input', {
                className: 'dshs-search',
                type: 'search',
                value: query,
                placeholder: t('search'),
                'aria-label': t('search'),
                onChange: (event) => setQuery(event.target.value),
              }),
            ),
            state.status === 'loading'
              ? h('div', { className: 'dshs-empty' }, t('loading'))
              : visible.length === 0
                ? h(
                    'div',
                    { className: 'dshs-empty' },
                    installed.length === 0 ? t('empty') : t('noMatch'),
                  )
                : h('div', { className: 'dshs-list' }, visible.map(card)),
            h('p', { className: 'dshs-hint' }, t('refreshHint')),
            modal,
          )
        }

        ctx.slots.inject('plugins.tab', () =>
          ctx.slots.register(
            {
              name: 'plugins.tab',
              id: 'studio',
              order: 55,
              label: () => t('tab'),
            },
            StudyPage,
          ),
        )
      },
    }
  },
})
