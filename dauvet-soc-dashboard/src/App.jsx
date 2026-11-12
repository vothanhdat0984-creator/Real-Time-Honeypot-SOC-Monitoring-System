import { useEffect, useMemo, useState } from 'react'
import { ActivityPanel, SessionsPanel, CountryName } from './SOCInsights.jsx'

const REFRESH_MS = 5000
const DISPLAY_LIMIT = 100
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const I18N = {
  vi: {
    brandSub: 'PHÒNG GIÁM SÁT AN NINH', navGroup: 'ĐIỀU HÀNH SOC',
    overview: 'Tổng quan', analytics: 'Phân tích', sessions: 'Phiên SSH', events: 'Nhật ký', alerts: 'Cảnh báo', status: 'Hệ thống',
    sideFooter: 'TRẠNG THÁI CẢM BIẾN', source: 'Cowrie / PostgreSQL',
    kicker: 'GIÁM SÁT THỜI GIAN THỰC / HONEYPOT LAB', headline: 'Toàn cảnh hoạt động Honeypot',
    subtitle: 'Theo dõi kết nối SSH/Telnet, phân tích hoạt động trong phiên và nhận diện dấu hiệu bất thường từ nhật ký honeypot.',
    apiOnline: 'API đã kết nối', apiOffline: 'Không thể truy cập máy chủ', refreshing: 'Đang kiểm tra kết nối',
    every: 'Cập nhật mỗi 5 giây', refresh: 'Làm mới', lastSync: 'Đồng bộ lần cuối',
    systemNote: 'API và PostgreSQL được xác nhận qua backend; Cowrie chỉ được xác minh khi probe container hoạt động.',
    metricsEyebrow: 'CHỈ SỐ GIÁM SÁT / TOÀN BỘ DỮ LIỆU',
    totalEvents: 'Tổng sự kiện', uniqueSources: 'Nguồn truy cập', failedLogins: 'Đăng nhập thất bại', totalAlerts: 'Cảnh báo bảo mật',
    snapshot: 'DỮ LIỆU GẦN NHẤT', recent100: '100 bản ghi gần nhất',
    composition: 'Phân bố hoạt động', compositionSub: 'Phân nhóm tối đa 100 sự kiện mới nhất được API trả về.',
    categorySession: 'Phiên kết nối', categoryAuth: 'Xác thực', categoryCommand: 'Câu lệnh', categoryClient: 'Giao thức / Client', categoryOther: 'Khác',
    latest: 'Hoạt động vừa ghi nhận', latestSub: 'Các sự kiện gần nhất từ nhật ký Cowrie.',
    activity: 'Nhật ký giám sát', activitySub: 'Tra cứu và đối chiếu sự kiện theo IP nguồn, phiên kết nối và loại hoạt động.',
    all: 'Tất cả', auth: 'Đăng nhập', command: 'Câu lệnh', session: 'Phiên', client: 'Giao thức', other: 'Khác',
    search: 'Tìm IP, mã phiên hoặc loại sự kiện…', time: 'Thời gian', event: 'Sự kiện', ip: 'IP nguồn', sessionId: 'Mã phiên', group: 'Phân nhóm',
    export: 'Xuất CSV', empty: 'Chưa có sự kiện phù hợp.', noData: 'Chưa có dữ liệu trong cơ sở dữ liệu.',
    waitForData: 'Kiểm tra Cowrie và soc_db_collector.py để nhận bản ghi mới.',
    showOf: 'Hiển thị', of: 'trên', records: 'bản ghi được API trả về',
    inspect: 'Chi tiết sự kiện', inspectorNote: 'Dữ liệu hiển thị giới hạn ở các trường API đang cung cấp. Chưa truy xuất câu lệnh và nội dung raw log.',
    alertsTitle: 'Hàng đợi cảnh báo', alertsSubtitle: 'Cảnh báo đã được Detection Engine ghi vào PostgreSQL.',
    alertEmpty: 'Chưa có cảnh báo được ghi nhận', alertEmptySub: 'Điều này không khẳng định không có tấn công; quy tắc phát hiện có thể chưa đủ điều kiện kích hoạt.',
    rule: 'Quy tắc', severity: 'Mức độ', attempts: 'Số lần thử', window: 'Cửa sổ', alertStatus: 'Trạng thái',
    high: 'Cao', critical: 'Nghiêm trọng', medium: 'Trung bình', low: 'Thấp', new: 'Mới', open: 'Đang xử lý', closed: 'Đã đóng',
    healthTitle: 'Tình trạng dịch vụ', healthSubtitle: 'Đối chiếu kết nối API, PostgreSQL và các thành phần giám sát.',
    api: 'FastAPI', database: 'PostgreSQL', sensor: 'Cảm biến Cowrie', sensorUnknown: 'Chưa có kiểm tra trực tiếp',
    healthOk: 'Hoạt động bình thường', healthFail: 'Không phản hồi', databaseOk: 'Đã kết nối qua API',
    notesTitle: 'Lưu ý vận hành', notesText: 'Sự kiện được làm mới mỗi 5 giây; số liệu phân tích khoảng 30 giây. Cảm biến Cowrie được kiểm tra qua probe container mỗi phút khi được bật. Khi đưa lên Internet cần HTTPS, xác thực và phân quyền.',
    noApiTitle: 'Không thể nhận dữ liệu từ API', noApiSub: 'Kiểm tra dịch vụ dauvet-api và cấu hình reverse proxy Nginx /api/ trên Ubuntu.',
    sourceLabel: 'NGUỒN DỮ LIỆU: HONEYPOT LAB', safe: 'Không đưa mật khẩu vào giao diện', close: 'Đóng', seconds: 'giây',
    countBased: 'Thống kê dựa trên 100 bản ghi gần nhất', since: 'Theo dõi được từ bản ghi',
    noRecent: 'Chưa có bản ghi nào để hiển thị.', unavailable: 'Không có', timeZone: 'Múi giờ ICT · UTC+7',
    monitoringTitle: 'MỨC ĐỘ GIÁM SÁT', monitoringOk: 'Bình thường', monitoringWatch: 'Đang theo dõi', monitoringAttention: 'Cần chú ý', monitoringOffline: 'Gián đoạn',
    monitoringUnknown: 'Chưa xác minh', openAlerts: 'Cảnh báo chưa đóng', highAlerts: 'Cảnh báo mức cao',
    alertScope: 'Trong tối đa 100 cảnh báo gần nhất', monitoringNote: 'Chưa kiểm chứng trực tiếp trạng thái Cowrie',
    sensorTitle: 'TRẠNG THÁI CẢM BIẾN', sensorName: 'Honeypot', sensorWait: 'Chưa xác minh',
    onlineLabel: 'Trực tuyến', offlineLabel: 'Gián đoạn', sensorDetail: 'Để xác nhận cảm biến cần API health riêng',
    apiShort: 'API', dbShort: 'CSDL', lastRefresh: 'Lần cập nhật',

  },
  en: {
    brandSub: 'SECURITY OPERATIONS LAB', navGroup: 'SOC WORKSPACE',
    overview: 'Overview', analytics: 'Analytics', sessions: 'SSH sessions', events: 'Event log', alerts: 'Alerts', status: 'System',
    sideFooter: 'SENSOR STATUS', source: 'Cowrie / PostgreSQL',
    kicker: 'REAL-TIME MONITORING / HONEYPOT LAB', headline: 'Honeypot activity overview',
    subtitle: 'Explore SSH/Telnet connections, investigate session behavior, and identify anomalies from honeypot event logs.',
    apiOnline: 'API connected', apiOffline: 'Server unavailable', refreshing: 'Checking connection',
    every: 'Auto-refresh every 5 seconds', refresh: 'Refresh', lastSync: 'Last synced',
    systemNote: 'This verifies the API and PostgreSQL only; Cowrie itself is not directly checked.',
    metricsEyebrow: 'ALL-TIME METRICS / ENTIRE DATABASE',
    totalEvents: 'Stored events', uniqueSources: 'Source IPs', failedLogins: 'Failed logins', totalAlerts: 'Created alerts',
    snapshot: 'RECENT EVENT SAMPLE', recent100: '100 latest records',
    composition: 'Activity distribution', compositionSub: 'Calculated from the current API sample, not all-time history.',
    categorySession: 'Sessions', categoryAuth: 'Authentication', categoryCommand: 'Commands', categoryClient: 'Protocol / Client', categoryOther: 'Other',
    latest: 'Latest activity', latestSub: 'Cowrie events refreshed with each polling interval.',
    activity: 'Security event log', activitySub: 'Filter, search and inspect event metadata.',
    all: 'All', auth: 'Logins', command: 'Commands', session: 'Sessions', client: 'Protocol', other: 'Other',
    search: 'Search IP, session ID or event type…', time: 'Time', event: 'Event', ip: 'Source IP', sessionId: 'Session ID', group: 'Category',
    export: 'Export CSV', empty: 'No matching events.', noData: 'No records in the database yet.',
    waitForData: 'Check Cowrie and soc_db_collector.py to ingest new records.',
    showOf: 'Showing', of: 'of', records: 'records returned by the API',
    inspect: 'Event details', inspectorNote: 'Only current API metadata is available. Command input and raw logs are not exposed yet.',
    alertsTitle: 'Alert queue', alertsSubtitle: 'Detections written to PostgreSQL by the Detection Engine.',
    alertEmpty: 'No alerts recorded', alertEmptySub: 'This does not prove there were no attacks; the detection rule may not have fired yet.',
    rule: 'Rule', severity: 'Severity', attempts: 'Attempts', window: 'Window', alertStatus: 'Status',
    high: 'High', critical: 'Critical', medium: 'Medium', low: 'Low', new: 'New', open: 'In progress', closed: 'Closed',
    healthTitle: 'Connection health', healthSubtitle: 'Direct checks of the API and available data.',
    api: 'FastAPI', database: 'PostgreSQL', sensor: 'Cowrie sensor', sensorUnknown: 'No direct health endpoint',
    healthOk: 'Responding', healthFail: 'No response', databaseOk: 'Connected, reported by API',
    notesTitle: 'Operations note', notesText: 'Events refresh every 5 seconds; analytics about every 30 seconds. The optional Cowrie container probe refreshes every minute. Internet deployment requires authentication, HTTPS and access controls.',
    noApiTitle: 'Unable to reach the API', noApiSub: 'Check the dauvet-api service and Nginx /api/ reverse proxy on Ubuntu.',
    sourceLabel: 'DATA SOURCE: HONEYPOT LAB', safe: 'Passwords are not displayed', close: 'Close', seconds: 'seconds',
    countBased: 'Metrics based on the last 100 events', since: 'Newest available event',
    noRecent: 'No recent events to show.', unavailable: 'Unavailable', timeZone: 'ICT time zone · UTC+7',
    monitoringTitle: 'MONITORING STATUS', monitoringOk: 'Normal', monitoringWatch: 'Monitoring', monitoringAttention: 'Attention needed', monitoringOffline: 'Unavailable',
    monitoringUnknown: 'Unverified', openAlerts: 'Unclosed alerts', highAlerts: 'High-severity alerts',
    alertScope: 'Based on up to 100 recent alerts', monitoringNote: 'Cowrie sensor status is not directly verified',
    sensorTitle: 'SENSOR STATUS', sensorName: 'Honeypot', sensorWait: 'Unverified',
    onlineLabel: 'Online', offlineLabel: 'Offline', sensorDetail: 'Sensor requires a separate health endpoint',
    apiShort: 'API', dbShort: 'Database', lastRefresh: 'Last refreshed',

  },
}

const EVENTS = {
  'cowrie.session.connect': ['Kết nối SSH mới', 'SSH connection', 'session'],
  'cowrie.session.closed': ['Đóng phiên SSH', 'SSH session closed', 'session'],
  'cowrie.session.params': ['Tham số phiên', 'Session parameters', 'session'],
  'cowrie.login.success': ['Đăng nhập vào honeypot', 'Honeypot login', 'auth'],
  'cowrie.login.failed': ['Đăng nhập thất bại', 'Failed login', 'auth'],
  'cowrie.command.input': ['Nhập câu lệnh', 'Command input', 'command'],
  'cowrie.client.version': ['Phiên bản SSH client', 'SSH client version', 'client'],
  'cowrie.client.kex': ['Trao đổi khóa SSH', 'SSH key exchange', 'client'],
  'cowrie.client.size': ['Kích thước terminal', 'Terminal size', 'client'],
  'cowrie.client.var': ['Biến môi trường client', 'Client environment', 'client'],
  'cowrie.log.closed': ['Đóng nhật ký phiên', 'Session log closed', 'session'],
  'cowrie.session.file_download': ['Tải tệp trong phiên', 'File download in session', 'command'],
}

function classify(eventId = '') {
  if (EVENTS[eventId]) return EVENTS[eventId][2]
  if (eventId.startsWith('cowrie.login.')) return 'auth'
  if (eventId.startsWith('cowrie.command.')) return 'command'
  if (eventId.startsWith('cowrie.session.') || eventId.startsWith('cowrie.log.')) return 'session'
  if (eventId.startsWith('cowrie.client.')) return 'client'
  return 'other'
}

function eventLabel(id, lang) {
  return EVENTS[id]?.[lang === 'vi' ? 0 : 1] || id || '—'
}

function Icon({ name, size = 20, stroke = 1.8 }) {
  const paths = {
    radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/><path d="M19 12h2M3 12h2M12 3v2M12 19v2"/></>,
    shield: <><path d="M12 2 21 6v6c0 5-3.5 8.4-9 10-5.5-1.6-9-5-9-10V6l9-4Z"/><path d="m8 12 2.6 2.6L16.5 9"/></>,
    sensor: <><circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.65 3.6 3 8 3s8-1.35 8-3V5M4 12c0 1.65 3.6 3 8 3s8-1.35 8-3"/></>,

    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    alert: <><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    server: <><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h7M11 17.5h7"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 12-2L20 12M4 12l2.4 5a7 7 0 0 0 12-2"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6"/></>,
    down: <><path d="M12 3v14M6 12l6 6 6-6M4 21h16"/></>,
    close: <><path d="M5 5 19 19M19 5 5 19"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    check: <><path d="m4 12 5 5L20 6"/></>,
    arrowUp: <><path d="M12 20V4M6 10l6-6 6 6"/></>,
    filter: <><path d="M3 5h18M6 12h12M9 19h6"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9"/></>,
    terminal: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="m6 8 4 4-4 4M12 16h6"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.activity}</svg>
}

function formattedNumber(value, lang) {
  const number = Number(value)
  return Number.isFinite(number) ? new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US').format(number) : '—'
}

function formattedDate(value, lang, { short = false } = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const opts = {
    timeZone: VIETNAM_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false,
    ...(short ? {} : { day: '2-digit', month: '2-digit', year: 'numeric', second: '2-digit' }),
  }
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', opts).format(date)
}

function SourceMark({ online, loading, t }) {
  return <span className={`connection-indicator ${online ? 'is-connected' : 'is-disconnected'}`}>
    <span className="connection-dot" />
    {loading ? t.refreshing : online ? t.apiOnline : t.apiOffline}
  </span>
}

function StatCard({ label, value, i, tone = '' }) {
  return <div className={`stat-card stat-card--${i} ${tone}`}>
    <div className="stat-card__top"><span className="stat-index">0{i+1} /</span><span className="stat-label">{label}</span></div>
    <strong className="stat-value">{value}</strong>
    <div className="stat-baseline" />
  </div>
}

function CategoryPill({ type, label }) {
  return <span className={`category-pill category-pill--${type}`}><span />{label}</span>
}

function EmptyState({ title, subtitle, icon = 'activity' }) {
  return <div className="empty-state"><span className="empty-state__icon"><Icon name={icon} size={26}/></span><strong>{title}</strong>{subtitle && <p>{subtitle}</p>}</div>
}

function EventTable({ rows, t, lang, onSelect, geoMap = {}, showTools = true }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const tags = ['all', 'auth', 'command', 'session', 'client', 'other']
  const filtered = useMemo(() => rows.filter(row => {
    const type = classify(row.event_id)
    if (category !== 'all' && type !== category) return false
    if (!query.trim()) return true
    const term = query.trim().toLowerCase()
    return [row.event_id, row.src_ip, row.session_id, eventLabel(row.event_id, lang)].some(v => String(v || '').toLowerCase().includes(term))
  }), [rows, query, category, lang])

  function exportCSV() {
    const header = ['id', 'event_id', 'src_ip', 'country_code', 'ip_scope', 'session_id', 'event_time_vn_utc_plus_7', 'event_time_original']
    const cell = v => {
      let text = String(v ?? '')
      if (/^\s*[=+@-]/.test(text)) text = "'" + text
      return `"${text.replaceAll('\"', '\"\"')}"`
    }
    const data = [header.join(','), ...filtered.map(x => [x.id, x.event_id, x.src_ip, geoMap[x.src_ip]?.country_code || '', geoMap[x.src_ip]?.scope || '', x.session_id, formattedDate(x.event_time, 'vi'), x.event_time].map(cell).join(','))].join('\r\n')
    const blob = new Blob(['\uFEFF' + data], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dauvet-soc-events.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <>
    {showTools && <div className="table-toolbar">
      <div className="filter-tabs" aria-label={t.group}>
        {tags.map(tag => <button type="button" key={tag} className={category === tag ? 'filter-tab active' : 'filter-tab'} onClick={() => setCategory(tag)}>{t[tag]}</button>)}
      </div>
      <div className="table-actions">
        <label className="searchbox"><Icon name="search" size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/></label>
        <button type="button" className="btn-secondary" onClick={exportCSV} disabled={filtered.length === 0}><Icon name="down" size={16}/><span>{t.export}</span></button>
      </div>
    </div>}
    <div className="table-scroll">
      <table className="events-table">
        <thead><tr><th>{t.time}</th><th>{t.event}</th><th>{t.ip}</th><th>{lang === 'vi' ? 'Quốc gia' : 'Country'}</th><th>{t.sessionId}</th><th>{t.group}</th><th aria-label="details" /></tr></thead>
        <tbody>
          {filtered.map(row => {
            const type = classify(row.event_id)
            return <tr key={row.id} className="event-row" onClick={() => onSelect(row)} tabIndex={0} onKeyDown={e => {if (e.key === 'Enter') onSelect(row)}} aria-label={`${eventLabel(row.event_id, lang)} ${row.src_ip || ''}`}>
              <td className="mono date-cell">{formattedDate(row.event_time, lang)}</td>
              <td><div className="event-name">{eventLabel(row.event_id, lang)}</div><span className="event-code mono">{row.event_id}</span></td>
              <td className="mono source-ip">{row.src_ip || '—'}</td>
              <td><CountryName geo={geoMap[row.src_ip]} lang={lang}/></td>
              <td className="mono session-code">{row.session_id || '—'}</td>
              <td><CategoryPill type={type} label={t[type]}/></td>
              <td className="table-arrow"><Icon name="arrow" size={15}/></td>
            </tr>
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <EmptyState title={rows.length ? t.empty : t.noData} subtitle={!rows.length ? t.waitForData : ''}/>}
    </div>
    <div className="table-footnote">{t.showOf} {formattedNumber(filtered.length, lang)} {t.of} {formattedNumber(rows.length, lang)} {t.records}</div>
  </>
}

function App() {
  const [lang, setLang] = useState('vi')
  const [tab, setTab] = useState('overview')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [timeWindow, setTimeWindow] = useState('24h')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [analyticsError, setAnalyticsError] = useState('')
  const [sessionData, setSessionData] = useState(null)
  const [commandsData, setCommandsData] = useState(null)
  const [socHealth, setSocHealth] = useState(null)
  const [geoMap, setGeoMap] = useState({})
  const t = I18N[lang]

  useEffect(() => { document.documentElement.lang = lang }, [lang])

  useEffect(() => {
    let alive = true
    let busy = false
    const controllers = new Set()
    async function get(path, signal) {
      const res = await fetch(path, { cache: 'no-store', signal })
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`)
      const value = await res.json()
      return value
    }
    async function update() {
      if (busy) return
      busy = true
      const controller = new AbortController()
      controllers.add(controller)
      if (alive) setLoading(true)
      try {
        const [health, summary, events, alerts] = await Promise.all([
          get('/api/trang-thai', controller.signal),
          get('/api/tong-quan', controller.signal),
          get(`/api/su-kien?gioi_han=${DISPLAY_LIMIT}`, controller.signal),
          get(`/api/canh-bao?gioi_han=${DISPLAY_LIMIT}`, controller.signal),
        ])
        if (!Array.isArray(events) || !Array.isArray(alerts) || !summary || typeof summary !== 'object') throw new Error('Unexpected API response format')
        if (alive) {
          setSnapshot({ health, summary, events, alerts })
          setApiError('')
          setLastSync(new Date().toISOString())
        }
      } catch (err) {
        if (alive && err.name !== 'AbortError') setApiError(err.message || 'Network error')
      } finally {
        controllers.delete(controller)
        if (alive) setLoading(false)
        busy = false
      }
    }
    update()
    const timer = setInterval(update, REFRESH_MS)
    return () => {alive = false; clearInterval(timer); for (const c of controllers) c.abort()}
  }, [refreshCounter])

  // Optional v4 endpoints: a failure never hides the proven v3 event/alert API.
  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    const get = async path => {
      const response = await fetch(path, {cache:'no-store', signal:controller.signal})
      if (!response.ok) throw new Error(`HTTP ${response.status} ${path}`)
      return response.json()
    }
    const updateIntel = async () => {
      const tasks = await Promise.allSettled([
        get(`/api/soc/phan-tich?khung=${timeWindow}`),
        get('/api/soc/phien?gioi_han=25'),
        get('/api/soc/lenh?gioi_han=12'),
        get('/api/soc/suc-khoe'),
      ])
      if (!alive) return
      if (tasks[0].status === 'fulfilled') { setAnalyticsData(tasks[0].value); setAnalyticsError('') }
      else if (tasks[0].reason?.name !== 'AbortError') { setAnalyticsError(String(tasks[0].reason?.message || 'Unavailable')); setAnalyticsData(null) }
      if (tasks[1].status === 'fulfilled') setSessionData(tasks[1].value)
      if (tasks[2].status === 'fulfilled') setCommandsData(tasks[2].value)
      if (tasks[3].status === 'fulfilled') setSocHealth(tasks[3].value)
    }
    updateIntel()
    const timer = setInterval(updateIntel, 30000)
    return () => { alive = false; controller.abort(); clearInterval(timer) }
  }, [timeWindow, refreshCounter])

  const ipListKey = useMemo(() => [...new Set((snapshot?.events || []).map(x => x.src_ip).filter(Boolean))].slice(0,100).sort().join('|'), [snapshot?.events])
  useEffect(() => {
    if (!ipListKey) return
    const controller = new AbortController()
    const qs = new URLSearchParams()
    ipListKey.split('|').forEach(ip => qs.append('ip', ip))
    fetch(`/api/soc/geo?${qs}`, {cache:'no-store',signal:controller.signal})
      .then(r => {if(!r.ok) throw new Error('GeoIP unavailable'); return r.json()})
      .then(setGeoMap)
      .catch(() => {}) // geo is optional; never block the event explorer
    return () => controller.abort()
  }, [ipListKey])

  const rows = snapshot?.events || []
  const alertRows = snapshot?.alerts || []
  const summary = snapshot?.summary
  const apiResponding = Boolean(snapshot) && !apiError && snapshot?.health?.trang_thai === 'hoat_dong'
  const dbResponding = apiResponding && snapshot?.health?.database === 'da_ket_noi'
  const online = dbResponding
  // Chỉ kết luận cảm biến đang hoạt động khi backend trả về trạng thái của cảm biến.
  // GET /api/trang-thai hiện chỉ xác nhận FastAPI và PostgreSQL.
  const sensorValue = socHealth?.cowrie ?? snapshot?.health?.sensor_status ?? snapshot?.health?.cowrie_status ?? null
  const sensorVerified = online && ['up', 'online', 'running', 'active'].includes(String(sensorValue ?? '').toLowerCase())
  const sensorOffline = online && ['down', 'offline', 'stopped', 'inactive'].includes(String(sensorValue ?? '').toLowerCase())
  const activeAlerts = online ? alertRows.filter(a => !['closed', 'resolved', 'dismissed'].includes(String(a.status || '').toLowerCase())) : []
  const highActiveAlerts = activeAlerts.filter(a => ['high', 'critical'].includes(String(a.severity || '').toLowerCase()))
  const activeAlertCount = online ? (analyticsData?.alert_summary?.open ?? activeAlerts.length) : 0
  const highAlertCount = online ? (analyticsData?.alert_summary?.high ?? highActiveAlerts.length) : 0
  const monitoringMode = !online || sensorOffline ? 'offline' : activeAlertCount ? 'attention' : sensorVerified ? 'normal' : 'watch'
  const monitoringMessage = monitoringMode === 'offline' ? t.monitoringOffline : monitoringMode === 'attention' ? t.monitoringAttention : monitoringMode === 'normal' ? t.monitoringOk : t.monitoringWatch
  const categories = useMemo(() => {
    const counts = { session: 0, auth: 0, command: 0, client: 0, other: 0 }
    rows.forEach(row => { counts[classify(row.event_id)] += 1 })
    return counts
  }, [rows])
  const distribution = ['session', 'auth', 'command', 'client', 'other']
  const maxCategory = Math.max(1, ...Object.values(categories))

  const tabs = [
    ['overview', 'grid'], ['analytics', 'globe'], ['sessions', 'terminal'], ['events', 'activity'], ['alerts', 'alert'], ['status', 'server'],
  ]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-symbol" aria-hidden="true"><img src="/brand-mark.png" alt="" /></span>
        <div><div className="brand-title">DẤU VẾT<span className="brand-period"> / SOC</span></div><div className="brand-sub">{t.brandSub}</div></div>
      </div>
      <div className="sidebar-rule" />
      <div className="sidebar-section-label">{t.navGroup}</div>
      <nav className="side-nav" aria-label="Navigation">
        {tabs.map(([name, icon], index) => <button type="button" key={name} className={`nav-link ${tab === name ? 'is-active' : ''}`} onClick={() => {setTab(name);setSelectedEvent(null)}}>
          <Icon name={icon} size={18}/><span>{t[name]}</span><span className="nav-index">0{index+1}</span>
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <section className="sensor-card" aria-label={t.sensorTitle}>
          <div className="sensor-card__title"><Icon name="sensor" size={17}/><strong>{t.sensorTitle}</strong></div>
          <div className="sensor-card__row"><span>{t.sensorName}</span><span className={`sensor-chip ${sensorVerified ? 'sensor-chip--online' : sensorOffline ? 'sensor-chip--offline' : 'sensor-chip--unknown'}`}><i />{sensorVerified ? t.onlineLabel : sensorOffline ? t.offlineLabel : t.sensorWait}</span></div>
          <div className="sensor-card__row"><span>{t.apiShort}</span><span className={`sensor-chip ${apiResponding ? 'sensor-chip--online' : 'sensor-chip--offline'}`}><i />{apiResponding ? t.onlineLabel : t.offlineLabel}</span></div>
          <div className="sensor-card__row"><span>{t.dbShort}</span><span className={`sensor-chip ${dbResponding ? 'sensor-chip--online' : 'sensor-chip--offline'}`}><i />{dbResponding ? t.onlineLabel : t.offlineLabel}</span></div>
        </section>
        <p>HPT / SOC <span className="mono">v0.4</span><br/>{t.timeZone}</p>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumb"><span>HPT / SOC</span><span className="breadcrumb-divider">/</span><strong>{t[tab]}</strong></div>
        <div className="topbar-controls">
          <span className="timezone-chip mono" title="Asia/Ho_Chi_Minh">ICT · UTC+07:00</span>
          <SourceMark online={online} loading={loading} t={t}/>
          <div className="language-switch" aria-label="Language"><button type="button" className={lang === 'vi' ? 'selected' : ''} onClick={() => setLang('vi')}>VN</button><span>/</span><button type="button" className={lang === 'en' ? 'selected' : ''} onClick={() => setLang('en')}>EN</button></div>
          <button type="button" className="icon-button" onClick={() => setRefreshCounter(c => c + 1)} title={t.refresh} aria-label={t.refresh} disabled={loading}><Icon name="refresh" size={17}/></button>
        </div>
      </header>

      <div className="content-area">
        <section className="page-heading">
          <div className="page-heading__content">
            <div className="eyebrow"><span className="eyebrow-dash"/>{t.kicker}</div>
            <h1>{tab === 'overview' ? t.headline : tab === 'analytics' ? t.analytics : tab === 'sessions' ? t.sessions : tab === 'events' ? t.activity : tab === 'alerts' ? t.alertsTitle : t.healthTitle}</h1>
            <p>{tab === 'overview' ? t.subtitle : tab === 'analytics' ? (lang === 'vi' ? 'Biểu đồ 24 giờ / 7 ngày, Top IP và phân bố quốc gia theo GeoIP.' : '24-hour / 7-day charts, top IPs, and country enrichment.') : tab === 'sessions' ? (lang === 'vi' ? 'Điều tra phiên SSH và hành vi trong môi trường Cowrie.' : 'Investigate SSH sessions and commands captured by Cowrie.') : tab === 'events' ? t.activitySub : tab === 'alerts' ? t.alertsSubtitle : t.healthSubtitle}</p>
          </div>
          <section className={`monitor-card monitor-card--${monitoringMode}`} aria-label={t.monitoringTitle}>
            <div className="monitor-card__top"><Icon name="shield" size={21}/><span>{t.monitoringTitle}</span></div>
            <strong className="monitor-card__state"><span className="monitor-card__bullet"/>{monitoringMessage}</strong>
            <div className="monitor-card__numbers">
              <div><span>{t.openAlerts}</span><strong>{online ? formattedNumber(activeAlertCount, lang) : '—'}</strong></div>
              <div><span>{t.highAlerts}</span><strong>{online ? formattedNumber(highAlertCount, lang) : '—'}</strong></div>
            </div>
            <small>{analyticsData ? (lang === 'vi' ? 'Cảnh báo từ toàn bộ PostgreSQL' : 'Alerts across all PostgreSQL records') : t.alertScope}{!sensorVerified ? ` · ${t.monitoringNote}` : ""}</small>
          </section>
        </section>

        {apiError && <div className="api-warning" role="alert"><Icon name="alert" size={19}/><div><strong>{t.noApiTitle}</strong><p>{t.noApiSub}</p><small className="mono">{apiError}</small></div></div>}

        {tab === 'overview' && <>
          <div className="section-meta"><span>{t.metricsEyebrow}</span><span className="section-code mono">POSTGRESQL / 01</span></div>
          <section className="stats-grid" aria-label="Overview metrics">
            <StatCard i={0} label={t.totalEvents} value={summary ? formattedNumber(summary.tong_su_kien, lang) : '—'}/>
            <StatCard i={1} label={t.uniqueSources} value={summary ? formattedNumber(summary.so_ip_nguon, lang) : '—'}/>
            <StatCard i={2} label={t.failedLogins} value={summary ? formattedNumber(summary.dang_nhap_that_bai, lang) : '—'}/>
            <StatCard i={3} label={t.totalAlerts} value={summary ? formattedNumber(summary.tong_canh_bao, lang) : '—'} tone="stat-card--alert"/>
          </section>
          <section className="insight-grid">
            <article className="panel panel--distribution">
              <div className="panel-header"><div><span className="panel-overline">01 / {t.snapshot}</span><h2>{t.composition}</h2><p>{t.compositionSub}</p></div><span className="panel-stamp mono">N={rows.length}</span></div>
              <div className="distribution-list">
                {distribution.map((category, idx) => <div className="distribution-item" key={category}>
                  <div className="distribution-item__label"><span className="distribution-item__num mono">0{idx+1}</span><span>{t[`category${category.charAt(0).toUpperCase()}${category.slice(1)}`]}</span><strong className="mono">{formattedNumber(categories[category], lang)}</strong></div>
                  <div className="distribution-track"><div className={`distribution-fill distribution-fill--${category}`} style={{width:`${(categories[category] / maxCategory) * 100}%`}}/></div>
                </div>)}
              </div>
              <div className="panel-footer"><Icon name="filter" size={15}/><span>{t.countBased}</span></div>
            </article>
            <article className="panel panel--signals">
              <div className="panel-header"><div><span className="panel-overline">02 / ACTIVITY</span><h2>{t.latest}</h2><p>{t.latestSub}</p></div><span className="panel-stamp"><Icon name="activity" size={19}/></span></div>
              <div className="signal-list">
                {rows.slice(0, 6).map((event, index) => <button className="signal-entry" type="button" key={event.id} onClick={() => setSelectedEvent(event)}>
                  <span className={`signal-entry__node signal-entry__node--${classify(event.event_id)}`}/><div><strong>{eventLabel(event.event_id, lang)}</strong><small className="mono">{event.src_ip || '—'}</small></div><span className="mono signal-entry__time">{formattedDate(event.event_time, lang, {short:true})}</span>
                </button>)}
                {rows.length === 0 && <EmptyState title={t.noRecent}/>}
              </div>
              <div className="panel-footer"><Icon name="clock" size={15}/><span>{t.every}</span></div>
            </article>
          </section>
          <ActivityPanel intel={analyticsData} error={analyticsError} lang={lang} windowValue={timeWindow} onWindowChange={value => {setAnalyticsData(null);setTimeWindow(value)}} compact/>
          <section className="panel panel--table">
            <div className="panel-header panel-header--table"><div><span className="panel-overline">03 / EVENT EXPLORER</span><h2>{t.activity}</h2><p>{t.activitySub}</p></div><button type="button" className="panel-link" onClick={() => setTab('events')}>{t.events}<Icon name="arrow" size={16}/></button></div>
            <EventTable rows={rows.slice(0, 8)} t={t} lang={lang} geoMap={geoMap} onSelect={setSelectedEvent} showTools={false}/>
          </section>
        </>}

        {tab === 'analytics' && <ActivityPanel intel={analyticsData} error={analyticsError} lang={lang} windowValue={timeWindow} onWindowChange={value => {setAnalyticsData(null);setTimeWindow(value)}}/>}

        {tab === 'sessions' && <SessionsPanel sessions={sessionData} commands={commandsData} lang={lang} loaded={Array.isArray(sessionData) && Array.isArray(commandsData)}/>}

        {tab === 'events' && <section className="panel panel--table full-table"><div className="panel-header"><div><span className="panel-overline">EVENT EXPLORER / API LIMIT {DISPLAY_LIMIT}</span><h2>{t.activity}</h2><p>{t.countBased}</p></div><span className="panel-stamp mono">{rows.length} / {DISPLAY_LIMIT}</span></div><EventTable rows={rows} t={t} lang={lang} geoMap={geoMap} onSelect={setSelectedEvent}/></section>}

        {tab === 'alerts' && <section className="panel alerts-panel"><div className="panel-header"><div><span className="panel-overline">DETECTION / QUEUE</span><h2>{t.alertsTitle}</h2><p>{t.alertsSubtitle}</p></div><span className="panel-stamp mono">{alertRows.length} / {DISPLAY_LIMIT}</span></div>
          {alertRows.length ? <div className="alert-list">{alertRows.map(item => <div className="alert-row" key={item.id}><div className="alert-row__id mono">#{item.id}</div><div className="alert-row__body"><strong>{item.rule_id}</strong><small>{t.ip}: {item.src_ip || '—'} · {formattedDate(item.created_at, lang)}</small></div><div className={`severity severity--${item.severity}`}>{t[item.severity] || item.severity}</div><div className="alert-row__numbers"><strong>{formattedNumber(item.attempt_count, lang)}</strong><span>{t.attempts} / {item.time_window_seconds ?? '—'}s</span></div><span className="alert-row__status">{t[item.status] || item.status || '—'}</span></div>)}</div> : <EmptyState icon="alert" title={t.alertEmpty} subtitle={t.alertEmptySub}/>}</section>}

        {tab === 'status' && <div className="system-grid"><section className="panel"><div className="panel-header"><div><span className="panel-overline">SERVICE CHECK / 01</span><h2>{t.healthTitle}</h2><p>{t.healthSubtitle}</p></div></div>
          <div className="health-row"><div><strong>{t.api}</strong><small>GET /api/trang-thai</small></div><span className={`health-value ${online ? 'health-value--ok' : ''}`}>{online ? t.healthOk : t.healthFail}</span></div>
          <div className="health-row"><div><strong>{t.database}</strong><small>honeypot_soc</small></div><span className={`health-value ${online ? 'health-value--ok' : ''}`}>{online ? t.databaseOk : t.unavailable}</span></div>
          <div className="health-row"><div><strong>{lang === 'vi' ? 'Collector' : 'Collector'}</strong><small>dauvet-collector.service</small></div><span className={`health-value ${socHealth?.collector === 'online' ? 'health-value--ok' : socHealth?.collector === 'unknown' ? 'health-value--unknown' : ''}`}>{socHealth?.collector === 'online' ? t.healthOk : socHealth?.collector === 'offline' ? t.healthFail : t.monitoringUnknown}</span></div>
          <div className="health-row"><div><strong>{t.sensor}</strong><small>honeypot-cowrie</small></div><span className={`health-value ${sensorVerified ? 'health-value--ok' : sensorOffline ? '' : 'health-value--unknown'}`}>{sensorVerified ? (lang === 'vi' ? 'Container đang chạy' : 'Container running') : sensorOffline ? t.healthFail : t.sensorUnknown}</span></div>
        </section><section className="panel system-notes"><div className="panel-header"><div><span className="panel-overline">OPERATIONS / 02</span><h2>{t.notesTitle}</h2></div></div><p>{t.notesText}</p><div className="ops-data"><div><span>{t.lastSync}</span><strong className="mono">{formattedDate(lastSync,lang)}</strong></div><div><span>{t.since}</span><strong className="mono">{formattedDate(rows[0]?.event_time,lang)}</strong></div></div></section></div>}

        <footer className="page-footer"><span>{t.sourceLabel}</span><span className="mono">{lastSync ? `${t.lastSync}: ${formattedDate(lastSync, lang)}` : '—'}</span></footer>
      </div>
    </main>

    {selectedEvent && <div className="drawer-backdrop" onClick={() => setSelectedEvent(null)}><aside className="details-drawer" role="dialog" aria-modal="true" aria-label={t.inspect} onClick={e => e.stopPropagation()}><div className="drawer-top"><div><span className="panel-overline">SOC / EVENT INSPECTOR</span><h2>{t.inspect}</h2></div><button type="button" className="icon-button" onClick={() => setSelectedEvent(null)} aria-label={t.close}><Icon name="close"/></button></div><div className="drawer-event-label">{eventLabel(selectedEvent.event_id, lang)}</div><CategoryPill type={classify(selectedEvent.event_id)} label={t[classify(selectedEvent.event_id)]}/><dl className="details-list">{[[t.event,selectedEvent.event_id],[t.ip,selectedEvent.src_ip],[lang === 'vi' ? 'Quốc gia' : 'Country',geoMap[selectedEvent.src_ip]?.country_code || (geoMap[selectedEvent.src_ip]?.scope === 'private' ? (lang === 'vi' ? 'Mạng nội bộ' : 'Private network') : '—')],[t.sessionId,selectedEvent.session_id],[t.time,formattedDate(selectedEvent.event_time,lang)],['ID',selectedEvent.id]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd className="mono">{v ?? '—'}</dd></div>)}</dl><p className="drawer-caution">{t.inspectorNote}</p></aside></div>}
  </div>
}

export default App
