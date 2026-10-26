window.__ModuleLoader__.load({
  id: '@ggxx/dsh-plugin-studio',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback, useMemo, useRef } = React

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
      subtitle: '按来源管理已安装插件的修改会话。本地开发的插件可恢复原会话，其余插件可创建带上下文的会话。',
      refresh: '刷新',
      refreshing: '正在刷新…',
      autoRefresh: '实时同步',
      autoRefreshHint: '每 5 秒同步一次插件库，安装、停用或移除的插件会自动更新。',
      loading: '正在载入插件库…',
      loadError: '插件库载入失败',
      retry: '重试',
      empty: '插件库中没有可管理的插件。',
      noMatch: '没有符合条件的插件。',
      search: '搜索插件、包名或描述',
      statsInstalled: '已安装插件',
      statsSessions: '关联会话',
      statsStale: '失效会话',
      extrasTitle: '未安装的插件目录',
      extrasHint: '工作区 plugins 目录中尚未加入当前 Profile 的插件，可在会话中安装后继续。',
      tagUninstalled: '未安装',
      actionInstall: '安装并创建会话',
      tagOn: '已启用',
      tagOff: '已停用',
      tagBuiltin: '内置',
      tagThird: '第三方',
      tagLocal: '本地开发',
      tagDownloaded: '下载安装',
      tagBuiltinKind: '系统内置',
      filterAll: '全部',
      tagStale: '会话失效',
      tagError: '异常',
      rows: '个插件行',
      actionStart: '开始会话',
      actionContinue: '继续会话',
      actionContinueWrite: '继续编辑',
      actionNew: '新建会话',
      cardAria: '打开该插件的修改会话',
      sessionLast: '最近会话',
      sessionWrote: '关联会话',
      candidatesTitle: '关联会话',
      candidatesHint: '按标题匹配的既有会话。选择一条继续，无需重新建立上下文。',
      candidateOpen: '继续',
      sessionMissing: '关联会话已失效，打开时将重新建立。',
      modalKicker: '插件会话',
      modalTitle: '新建修改会话',
      modalSub: '会话将携带该插件的来源、路径与插件行信息。',
      factsTitle: '插件信息',
      factPackage: '包名',
      factVersion: '版本',
      factStatus: '状态',
      factSource: '源码目录',
      factInstalled: '已安装位置',
      factPatch: '补丁文件',
      factProfile: 'Profile',
      factRows: '插件行',
      sourceUnknown: '未找到（随安装包内置）',
      sourceLoading: '正在解析…',
      registrySuffix: '注册表副本',
      registryNote:
        '该副本由注册表安装，直接修改不会持久。通常复制到工作区并改为 link 安装，或新建覆盖 bundle；开场说明已请求对应方案。',
      briefLabel: '开场说明',
      briefHint: '该说明将作为会话首条消息发送，可补充具体修改要求或先行精简。',
      cancel: '取消',
      close: '关闭',
      start: '创建会话',
      starting: '正在创建…',
      continueLast: '继续关联会话',
      started: '修改会话已创建。',
      draftOpened: '已创建会话，开场说明已填入输入框。',
      continued: '已恢复关联会话。',
      continuedWriting: '已恢复该插件的既有会话。',
      staleCleared: '关联会话不可用，记录已清除。',
      startFailed: '创建会话失败',
      promptFailed: '会话已创建，但开场说明发送失败',
      continueFailed: '无法打开会话',
      noRemote: '会话服务不可用，请重新打开插件页面或重启应用。',
      noWorkspace: '会话导航不可用，请重新打开插件页面或重启应用。',
      requestFailed: '请求失败',
      factsFailed: '无法读取插件路径，仍可编辑说明并创建会话。',
      builtinNote: '内置插件源码随安装包发布，修改通常通过本地覆盖 bundle 实现。',
      refreshHint: '数据来自当前 Profile 的插件库；本地链接安装的插件会显示真实源码目录。',
    }

    const en = {
      tab: 'Sessions',
      title: 'Plugin Sessions',
      subtitle:
        'Manage modification sessions for installed plugins by origin. Locally developed plugins resume their original session; others receive a context-seeded session.',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      autoRefresh: 'Live sync',
      autoRefreshHint: 'Syncs the plugin library every 5 seconds; installs, disables and removals update automatically.',
      loading: 'Loading the plugin library…',
      loadError: 'Could not load the plugin library',
      retry: 'Retry',
      empty: 'No manageable plugins in this library.',
      noMatch: 'No plugin matches these filters.',
      search: 'Search plugin, package or description',
      statsInstalled: 'Installed plugins',
      statsSessions: 'Linked sessions',
      statsStale: 'Stale sessions',
      extrasTitle: 'Uninstalled plugin folders',
      extrasHint: 'Plugin folders under the workspace that are not in this profile. Install them in a session to continue.',
      tagUninstalled: 'Not installed',
      actionInstall: 'Install and create session',
      tagOn: 'Enabled',
      tagOff: 'Disabled',
      tagBuiltin: 'Built-in',
      tagThird: 'Third-party',
      tagLocal: 'Local development',
      tagDownloaded: 'Downloaded',
      tagBuiltinKind: 'System',
      filterAll: 'All',
      tagStale: 'Stale',
      tagError: 'Error',
      rows: 'plugin rows',
      actionStart: 'Start session',
      actionContinue: 'Continue session',
      actionContinueWrite: 'Resume editing',
      actionNew: 'New session',
      cardAria: 'Open a modification session for this plugin',
      sessionLast: 'Recent session',
      sessionWrote: 'Linked session',
      candidatesTitle: 'Linked sessions',
      candidatesHint: 'Existing sessions matched by title. Choose one to continue without rebuilding context.',
      candidateOpen: 'Continue',
      sessionMissing: 'The linked session is unavailable; opening will create a new one.',
      modalKicker: 'Plugin session',
      modalTitle: 'New modification session',
      modalSub: 'The session will carry this plugin’s origin, paths and rows.',
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
      registrySuffix: 'registry copy',
      registryNote:
        'This copy is registry-installed; editing in place does not persist. Copy it into the workspace and link it, or create an overriding bundle. The opening brief already asks for the plan.',
      briefLabel: 'Opening brief',
      briefHint: 'Sent as the first message of the session. Add your concrete request or trim it first.',
      cancel: 'Cancel',
      close: 'Close',
      start: 'Create session',
      starting: 'Creating…',
      continueLast: 'Continue linked session',
      started: 'Modification session created.',
      draftOpened: 'Session created; the opening brief is in the composer.',
      continued: 'Linked session restored.',
      continuedWriting: 'Restored the existing session for this plugin.',
      staleCleared: 'The linked session is unavailable; its record was cleared.',
      startFailed: 'Could not create the session',
      promptFailed: 'The session was created, but the opening brief could not be sent',
      continueFailed: 'Could not open the session',
      noRemote: 'The session service is unavailable. Reopen the Plugins page or restart the app.',
      noWorkspace: 'Session navigation is unavailable. Reopen the Plugins page or restart the app.',
      requestFailed: 'Request failed',
      factsFailed: 'Could not read the plugin paths; the brief is still editable and the session can start.',
      builtinNote: 'Built-in plugins ship with the installation; changes usually take the form of a local overriding bundle.',
      refreshHint: 'Reads the current profile’s plugin library; link-installed plugins report their real source directory.',
    }

    const CSS = `
.dshs-page { box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; max-width: 1000px; margin: 0 auto; padding: 24px 28px 56px; color: var(--dsw-alias-label-primary); font-size: 13px; }
.dshs-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.dshs-title { margin: 0 0 6px; font-size: 20px; line-height: 1.25; font-weight: 600; letter-spacing: -0.01em; }
.dshs-sub { margin: 0; max-width: 620px; font-size: 12.5px; line-height: 1.7; color: var(--dsw-alias-label-secondary); }
.dshs-head-actions { display: flex; align-items: center; flex: none; gap: 12px; }
.dshs-live { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .02em; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.dshs-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent); }
.dshs-hint { margin: 0; font-size: 11.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.dshs-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 12px; }
.dshs-stat { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dshs-stat b { font-size: 24px; line-height: 1.1; font-weight: 600; font-variant-numeric: tabular-nums; }
.dshs-stat span { font-size: 11px; letter-spacing: .02em; color: var(--dsw-alias-label-secondary); }
.dshs-filters { display: inline-flex; flex-wrap: wrap; gap: 2px; width: fit-content; max-width: 100%; padding: 3px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.dshs-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border: none; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11.5px; line-height: 1; white-space: nowrap; cursor: pointer; }
.dshs-chip:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.dshs-chip.active { color: var(--dsw-alias-label-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
.dshs-chip:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.dshs-chip-count { font-size: 10.5px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }
.dshs-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshs-search { flex: 1 1 260px; min-width: 180px; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
.dshs-search:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: -1px; }
.dshs-list { display: flex; flex-direction: column; gap: 12px; }
.dshs-card { box-sizing: border-box; display: flex; gap: 14px; width: 100%; padding: 16px 18px; border: 1px solid var(--dsw-alias-border-l1); border-inline-start: 3px solid transparent; border-radius: 14px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; text-align: start; cursor: pointer; transition: border-color .16s ease, background-color .16s ease; }
.dshs-card:hover { border-color: var(--dsw-alias-border-l2); background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 55%, var(--dsw-alias-bg-layer-1)); }
.dshs-card:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 2px; }
.dshs-card.kind-local { border-inline-start-color: var(--dsw-alias-state-success-primary); }
.dshs-card.kind-downloaded { border-inline-start-color: var(--dsw-alias-brand-primary); }
.dshs-card.kind-builtin { border-inline-start-color: var(--dsw-alias-state-warn-primary); }
.dshs-icon { flex: none; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); font-size: 16px; font-weight: 600; }
.dshs-icon img { display: block; width: 100%; height: 100%; object-fit: cover; }
.dshs-main { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
.dshs-name { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.dshs-name strong { font-size: 14.5px; font-weight: 600; overflow-wrap: anywhere; }
.dshs-pkg { font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.dshs-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.dshs-tag { flex: none; padding: 3px 8px; border: none; border-radius: 6px; background: var(--dsw-alias-bg-layer-2); font-size: 10.5px; line-height: 1.3; letter-spacing: .02em; white-space: nowrap; color: var(--dsw-alias-label-secondary); }
.dshs-tag.on { color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); }
.dshs-tag.off { color: var(--dsw-alias-state-idle-primary); }
.dshs-tag.builtin { color: var(--dsw-alias-state-warn-primary); }
.dshs-tag.third { color: var(--dsw-alias-brand-primary); }
.dshs-tag.err { color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
.dshs-tag.kind-local { color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); }
.dshs-tag.kind-downloaded { color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }
.dshs-tag.kind-builtin { color: var(--dsw-alias-state-warn-primary); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent); }
.dshs-session { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 2px; padding: 8px 12px; border-radius: 10px; background: var(--dsw-alias-bg-layer-2); font-size: 11.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
.dshs-session b { font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.dshs-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.dshs-btn { appearance: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 1; white-space: nowrap; cursor: pointer; transition: background-color .15s ease, border-color .15s ease; }
.dshs-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dshs-btn:disabled { opacity: .5; cursor: default; }
.dshs-btn.primary { border-color: transparent; background: var(--dsw-alias-brand-primary); color: #fff; }
.dshs-btn.primary:hover:not(:disabled) { filter: brightness(1.06); }
.dshs-btn:focus-visible, .dshs-iconbtn:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.dshs-empty { padding: 26px 18px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 12px; text-align: center; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dshs-extras { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.dshs-section-title { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .01em; }
.dshs-extra { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dshs-extra-main { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
.dshs-extra-main b { font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.dshs-result { white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.dshs-result.ok { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 30%, var(--dsw-alias-border-l1)); }
.dshs-result.err { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l1)); }
.dshs-backdrop { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 28px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 30%, transparent); }
.dshs-modal { display: flex; flex-direction: column; width: min(720px, 100%); max-height: min(86vh, 840px); overflow: hidden; border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 24px 64px color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent); }
.dshs-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dshs-kicker { margin-bottom: 4px; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.dshs-modal-title { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 600; letter-spacing: -0.01em; }
.dshs-modal-sub { margin: 6px 0 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.dshs-iconbtn { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 18px; line-height: 1; cursor: pointer; }
.dshs-iconbtn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dshs-modal-body { display: flex; flex-direction: column; gap: 12px; padding: 16px 22px; overflow-y: auto; }
.dshs-facts { display: flex; flex-direction: column; gap: 8px; padding: 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dshs-fact { display: flex; gap: 12px; font-size: 12px; line-height: 1.55; }
.dshs-fact span { flex: none; width: 84px; color: var(--dsw-alias-label-secondary); }
.dshs-fact b { min-width: 0; font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; font-weight: 450; overflow-wrap: anywhere; }
.dshs-label { margin-top: 2px; font-size: 12px; font-weight: 600; }
.dshs-textarea { box-sizing: border-box; width: 100%; min-height: 220px; resize: vertical; padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; font-size: 12px; line-height: 1.65; }
.dshs-textarea:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: -1px; }
.dshs-modal-foot { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; padding: 14px 22px 18px; border-top: 1px solid var(--dsw-alias-border-l1); }
.dshs-candidates { display: flex; flex-direction: column; gap: 8px; }
.dshs-candidate { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; text-align: start; cursor: pointer; }
.dshs-candidate:hover:not(:disabled) { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.dshs-candidate:disabled { opacity: .5; cursor: default; }
.dshs-candidate:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.dshs-candidate-main { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.dshs-candidate-main b { min-width: 0; font-size: 12.5px; font-weight: 600; overflow-wrap: anywhere; }
.dshs-candidate-time { flex: none; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.dshs-candidate-snippet { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
@media (max-width: 640px) {
  .dshs-page { padding: 18px 16px 40px; }
  .dshs-head { flex-direction: column; align-items: stretch; }
  .dshs-head-actions { justify-content: space-between; }
  .dshs-card { padding: 14px; }
  .dshs-backdrop { padding: 12px; }
  .dshs-modal-head, .dshs-modal-body, .dshs-modal-foot { padding-inline: 14px; }
  .dshs-fact span { width: 68px; }
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

    /**
     * Where an installed plugin came from:
     * - installation: ships with the app
     * - profile + editable source: written locally (link/file install)
     * - profile without source: downloaded from a registry
     */
    function kindOf(bundle, facts) {
      const availability = bundle?.availability
      if (availability === 'installation') return 'builtin'
      if (availability !== 'profile') return bundle?.official === true ? 'builtin' : 'downloaded'
      if (facts?.sourceDir) return 'local'
      if (facts === undefined) return 'unknown'
      return 'downloaded'
    }

    function kindLabel(kind, t) {
      if (kind === 'local') return t('tagLocal')
      if (kind === 'downloaded') return t('tagDownloaded')
      if (kind === 'builtin') return t('tagBuiltinKind')
      return ''
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
      const mode = bundle?.uninstalled
        ? 'workspace'
        : facts?.sourceDir
          ? 'source'
          : facts?.installedDir
            ? 'registry'
            : 'builtin'
      const origin = kindOf(bundle, facts)
      const originLabel =
        (language === 'zh'
          ? { local: '自己写的', downloaded: '下载的', builtin: '系统自带', unknown: '来源未识别' }
          : { local: 'yours', downloaded: 'downloaded', builtin: 'built-in', unknown: 'unknown origin' })[origin] ||
        (language === 'zh' ? '第三方' : 'third-party')
      if (language === 'zh') {
        if (mode === 'workspace') {
          return [
            '【插件安装与修改会话】',
            '',
            '工作区里有一个还没安装的插件目录，我想在这里把它装上，然后继续改。',
            '',
            '插件：' + title,
            '目录：' + facts.sourceDir + '（还没安装）',
            facts?.profileDir ? 'Profile：' + facts.profileDir : null,
            '',
            '先做三件事：',
            '1. 读这个目录里的 package.json、cordis.patch.yml、index.js、client.js，确认它是 DSH 插件，并说明它做什么。',
            '2. 用 plugin_manager 的 install_bundle 安装这个目录；如实报告安装结果（已应用还是需要重启）。',
            '3. 问我接下来要改什么。',
            '',
            '安装完成后先不要急着改代码，等我说需求。之后从「插件 → 会话工坊」里点这个插件，可以回到这条会话继续。',
          ]
            .filter(Boolean)
            .join('\n')
        }
        return [
          '【插件修改会话】',
          '',
          '我要在这个会话里继续修改一个已安装的 DSH 插件，请把这里当作它的长期修改现场。',
          '',
          '插件：' + title,
          '包名：' + pkg,
          '状态：' + (bundle?.enabled ? '已启用' : '已停用') + ' · ' + originLabel,
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
      if (mode === 'workspace') {
        return [
          '[Plugin install and modification session]',
          '',
          'A plugin directory in the workspace has not been installed yet; install it here, then keep changing it.',
          '',
          'Plugin: ' + title,
          'Directory: ' + facts.sourceDir + ' (not installed yet)',
          facts?.profileDir ? 'Profile: ' + facts.profileDir : null,
          '',
          'First do three things:',
          '1. Read package.json, cordis.patch.yml, index.js and client.js in that directory, confirm it is a DSH plugin, and describe what it does.',
          '2. Install the directory with plugin_manager install_bundle; report the actual result (applied or restart required).',
          '3. Ask me what to change next.',
          '',
          'Do not edit code before I describe the change. Afterwards, open this plugin from "Plugins → Sessions" to come back to this conversation.',
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
        'State: ' + (bundle?.enabled ? 'enabled' : 'disabled') + ' · ' + originLabel,
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

        /** The path of the current (or most recently active) workspace. */
        function workspaceRoot() {
          try {
            const workspaces = service('workspaces')?.list?.getSnapshot?.()
            const sessions = service('sessions')?.list?.getSnapshot?.()
            const items = Array.isArray(workspaces?.items) ? workspaces.items : []
            let best = undefined
            let bestTime = -1
            for (const item of items) {
              for (const id of Array.isArray(item?.sessionIds) ? item.sessionIds : []) {
                const time = Number(sessions?.byId?.[id]?.updatedAt || 0)
                if (time > bestTime) {
                  bestTime = time
                  best = item?.path
                }
              }
            }
            return best ?? items.find((item) => item?.path)?.path
          } catch {
            return undefined
          }
        }

        /**
         * Directories under `<workspace>/plugins` that are not installed bundles.
         * Best-effort: the directory-picker Remote may be unavailable, and then
         * this simply reports nothing.
         */
        async function scanWorkspacePlugins(root, installedNames) {
          const picker = ctx.remote?.directoryPicker
          if (!picker || typeof picker.list !== 'function' || !root) return []
          let entries = []
          try {
            const controller = new AbortController()
            const answer = await picker.list(String(root).replace(/[\\/]+$/, '') + '/plugins', controller.signal)
            if (answer?.ok === true && Array.isArray(answer.value?.entries)) entries = answer.value.entries
          } catch {
            return []
          }
          const found = []
          for (const entry of entries) {
            const name = typeof entry?.name === 'string' ? entry.name : ''
            if (!name || entry.hidden === true || installedNames.has(name)) continue
            found.push({ name, path: entry.path || String(root) + '/plugins/' + name })
          }
          return found
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
          if (bundle?.uninstalled) return (language() === 'zh' ? '安装插件 · ' : 'Install plugin · ') + label
          return (language() === 'zh' ? '改插件 · ' : 'Edit plugin · ') + label
        }

        function StudyPage() {
          const [tick, setTick] = useState(0)
          const [reloadToken, setReloadToken] = useState(0)
          const [state, setState] = useState({
            status: 'loading',
            bundles: [],
            signature: '',
            liveSessions: null,
            titleIndex: new Map(),
            error: null,
            lastSync: 0,
            extraDirs: [],
            extraSignature: '',
          })
          const [query, setQuery] = useState('')
          const [kindFilter, setKindFilter] = useState('all')
          const [ledger, setLedger] = useState(() => readLedger())
          const [active, setActive] = useState(null)
          const [busy, setBusy] = useState(null)
          const [notice, setNotice] = useState(null)
          const [factsMap, setFactsMap] = useState({})
          const briefRef = useRef(null)
          const loadingRef = useRef(false)

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

          // Load (and re-load) the installed bundle list. Auto refreshes stay
          // silent; a manual refresh also drops cached facts so a moved source is
          // resolved again.
          const loadBundles = useCallback(async (mode) => {
            if (loadingRef.current) return
            loadingRef.current = true
            if (mode !== 'auto') {
              setState((current) => ({
                ...current,
                status: current.bundles.length > 0 ? 'refreshing' : 'loading',
                error: null,
              }))
            }
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
              const list = Array.isArray(bundles) ? bundles : []
              const signature = list
                .map((bundle) =>
                  [
                    bundle?.name,
                    bundle?.version,
                    bundle?.enabled ? 1 : 0,
                    bundle?.installed ? 1 : 0,
                    bundle?.availability,
                  ].join(':'),
                )
                .sort()
                .join('|')
              setState((current) => ({
                ...current,
                status: 'ready',
                error: null,
                bundles: current.signature === signature && current.bundles.length > 0 ? current.bundles : list,
                signature,
                liveSessions: live ?? current.liveSessions,
                titleIndex: index.titles,
                lastSync: Date.now(),
              }))
              const root = workspaceRoot()
              if (root) {
                const installedNames = new Set()
                for (const bundle of list) {
                  if (!bundle?.name) continue
                  installedNames.add(bundle.name)
                  installedNames.add(baseNameOf(bundle.name))
                }
                scanWorkspacePlugins(root, installedNames)
                  .then((dirs) => {
                    const extraSignature = dirs.map((dir) => dir.name).join('|')
                    setState((current) =>
                      current.extraSignature === extraSignature
                        ? current
                        : { ...current, extraDirs: dirs, extraSignature },
                    )
                  })
                  .catch(() => {
                    /* best-effort */
                  })
              }
            } catch (error) {
              setState((current) => ({
                ...current,
                status: current.bundles.length > 0 ? 'ready' : 'error',
                error: textOf(error),
              }))
            } finally {
              loadingRef.current = false
            }
          }, [])

          useEffect(() => {
            loadBundles('initial')
          }, [reloadToken, loadBundles])

          // Live detection: poll the host's bundle directory and refresh on focus
          // so a plugin installed while this page is open appears by itself.
          useEffect(() => {
            const tick = () => {
              if (typeof document === 'undefined' || !document.hidden) loadBundles('auto')
            }
            const timer = setInterval(tick, 5000)
            const onVisible = () => {
              if (typeof document === 'undefined' || !document.hidden) loadBundles('auto')
            }
            document.addEventListener('visibilitychange', onVisible)
            window.addEventListener('focus', onVisible)
            return () => {
              clearInterval(timer)
              document.removeEventListener('visibilitychange', onVisible)
              window.removeEventListener('focus', onVisible)
            }
          }, [loadBundles])

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
              .filter((bundle) => bundle && !CORE.has(bundle.name))
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
                const rank = { local: 0, downloaded: 1, builtin: 2, unknown: 3 }
                const delta =
                  (rank[kindOf(left, factsMap[left.name])] ?? 3) - (rank[kindOf(right, factsMap[right.name])] ?? 3)
                if (delta !== 0) return delta
                return displayName(left, languageId).localeCompare(displayName(right, languageId))
              })
          }, [state.bundles, factsMap, languageId, tick])

          const kindCounts = useMemo(() => {
            const counts = { local: 0, downloaded: 0, builtin: 0, unknown: 0 }
            for (const bundle of installed) counts[kindOf(bundle, factsMap[bundle.name])] += 1
            return counts
          }, [installed, factsMap])

          const byKind = useMemo(
            () =>
              kindFilter === 'all'
                ? installed
                : installed.filter((bundle) => kindOf(bundle, factsMap[bundle.name]) === kindFilter),
            [installed, kindFilter, factsMap],
          )

          const visible = useMemo(() => {
            const needle = query.trim().toLowerCase()
            if (!needle) return byKind
            return byKind.filter((bundle) => {
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
          }, [byKind, query, languageId, tick])

          /** Installed source directories, to avoid listing them as uninstalled folders. */
          const installedDirs = useMemo(() => {
            const set = new Set()
            for (const facts of Object.values(factsMap)) {
              if (facts?.sourceDir) set.add(String(facts.sourceDir).replace(/\\/g, '/').toLowerCase())
            }
            return set
          }, [factsMap])

          const extraDirs = useMemo(
            () =>
              state.extraDirs.filter(
                (dir) => !installedDirs.has(String(dir.path).replace(/\\/g, '/').toLowerCase()),
              ),
            [state.extraDirs, installedDirs],
          )

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

          const manualRefresh = useCallback(() => {
            factsCache.clear()
            setReloadToken((value) => value + 1)
          }, [])

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

          const openDirectoryWindow = useCallback((dir) => {
            const bundle = {
              name: dir.name,
              uninstalled: true,
              availability: 'workspace',
              official: false,
              enabled: false,
              rows: [],
              meta: { title: dir.name },
            }
            const facts = {
              sourceDir: dir.path,
              profileDir: workspaceRoot() ?? null,
              patchPath: null,
            }
            setActive({
              bundle,
              facts,
              factsState: 'ready',
              brief: buildBrief(bundle, facts, language()),
              touched: false,
              error: null,
            })
          }, [])

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
            const kind = kindOf(bundle, factsMap[bundle.name])
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
                className: 'dshs-card kind-' + kind,
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
                  kind !== 'unknown'
                    ? h('span', { className: 'dshs-tag kind-' + kind }, kindLabel(kind, t))
                    : null,
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
                              (active.bundle.uninstalled
                                ? t('tagUninstalled')
                                : kindLabel(kindOf(active.bundle, active.facts), t) || t('tagThird')),
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
                'div',
                { className: 'dshs-head-actions' },
                h(
                  'span',
                  { className: 'dshs-live', title: t('autoRefreshHint') },
                  h('span', { className: 'dshs-dot', 'aria-hidden': true }),
                  t('autoRefresh'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshs-btn',
                    disabled: state.status === 'loading' || state.status === 'refreshing',
                    onClick: manualRefresh,
                  },
                  state.status === 'refreshing' ? t('refreshing') : t('refresh'),
                ),
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
                      onClick: manualRefresh,
                    },
                    t('retry'),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'dshs-filters' },
              [
                { id: 'all', label: t('filterAll'), count: installed.length },
                { id: 'local', label: t('tagLocal'), count: kindCounts.local },
                { id: 'downloaded', label: t('tagDownloaded'), count: kindCounts.downloaded },
                { id: 'builtin', label: t('tagBuiltinKind'), count: kindCounts.builtin },
              ].map((tab) =>
                h(
                  'button',
                  {
                    key: tab.id,
                    type: 'button',
                    className: 'dshs-chip' + (kindFilter === tab.id ? ' active' : ''),
                    'aria-pressed': kindFilter === tab.id,
                    onClick: () => setKindFilter(tab.id),
                  },
                  tab.label,
                  h('span', { className: 'dshs-chip-count' }, String(tab.count)),
                ),
              ),
            ),
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
            extraDirs.length > 0
              ? h(
                  'section',
                  { className: 'dshs-extras' },
                  h('h3', { className: 'dshs-section-title' }, t('extrasTitle')),
                  h('p', { className: 'dshs-hint' }, t('extrasHint')),
                  extraDirs.map((dir) =>
                    h(
                      'div',
                      { className: 'dshs-extra', key: dir.path },
                      h(
                        'div',
                        { className: 'dshs-extra-main' },
                        h('b', null, dir.name),
                        h('span', { className: 'dshs-tag err' }, t('tagUninstalled')),
                        h('span', { className: 'dshs-pkg' }, dir.path),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dshs-btn primary',
                          onClick: () => openDirectoryWindow(dir),
                        },
                        t('actionInstall'),
                      ),
                    ),
                  ),
                )
              : null,
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
