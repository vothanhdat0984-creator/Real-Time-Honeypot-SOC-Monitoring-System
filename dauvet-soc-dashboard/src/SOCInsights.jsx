import { useMemo } from 'react'

const COPY = {
  vi: {
    analytics: 'Phân tích mối đe dọa', range: 'Khoảng thời gian', day: '24 giờ', week: '7 ngày',
    heading: 'Diễn biến truy cập honeypot', caption: 'Tổng hợp trực tiếp từ toàn bộ PostgreSQL, không chỉ 100 sự kiện mới nhất.',
    events: 'Sự kiện', failed: 'Đăng nhập thất bại', commands: 'Câu lệnh', ips: 'Số IP nguồn',
    topSources: 'Nguồn truy cập nổi bật', topSub: 'Theo số sự kiện trong khoảng thời gian đã chọn.',
    country: 'Quốc gia', geography: 'Phân bố địa lý', geoSub: 'Ước tính từ tối đa 250 IP nguồn nổi bật bằng GeoIP cục bộ.',
    address: 'IP nguồn', attempts: 'Thất bại', total: 'Sự kiện',
    privateIP: 'Mạng nội bộ', noGeo: 'Chưa cấu hình GeoIP', unknown: 'Chưa xác định',
    noCountry: 'Chưa có quốc gia được xác định.', noResults: 'Chưa có hoạt động trong khoảng thời gian này.',
    geoNote: 'GeoIP chỉ xác định gần đúng quốc gia của IP công khai; VPN hoặc proxy có thể khiến kết quả khác vị trí thật.',
    geoSetup: 'Tích hợp GeoLite2 chưa hoạt động. IP nội bộ không có quốc gia và sẽ luôn hiển thị là mạng nội bộ.',
    groups: 'Loại sự kiện thường gặp', groupSub: 'Đếm theo loại event_id trong khoảng thời gian.',
    sessions: 'Phiên truy cập SSH', sessionsSub: 'Tổng hợp phiên từ dữ liệu Cowrie, sắp theo hoạt động mới nhất.',
    session: 'Mã phiên', from: 'Nguồn truy cập', duration: 'Thời gian', activity: 'Hoạt động', state: 'Tình trạng',
    closed: 'Đã kết thúc', unfinished: 'Chưa thấy sự kiện đóng', lastEvent: 'Sự kiện cuối',
    noSession: 'Chưa có phiên để hiển thị.',
    cmdTitle: 'Lệnh gần đây', cmdSubtitle: 'Chỉ hiển thị dữ liệu lệnh Cowrie; không hiển thị mật khẩu đăng nhập.',
    noCmd: 'Chưa có lệnh được ghi nhận.', alertOpen: 'Cảnh báo chưa đóng', alertHigh: 'Cảnh báo mức cao',
    apiPending: 'Đang chờ API phân tích v4', apiPendingSub: 'Giao diện cũ vẫn hoạt động. Cài đặt tiện ích FastAPI đi kèm bản nâng cấp để bật biểu đồ và GeoIP.',
    period: 'Dữ liệu trong khoảng', sample: 'Dữ liệu từ PostgreSQL', noName: 'Không có thông tin',
  },
  en: {
    analytics: 'Threat intelligence', range: 'Time window', day: '24 hours', week: '7 days',
    heading: 'Honeypot activity over time', caption: 'Aggregated from the entire PostgreSQL database, not just the most recent 100 events.',
    events: 'Events', failed: 'Failed logins', commands: 'Commands', ips: 'Unique IPs',
    topSources: 'Top source addresses', topSub: 'Ranked by event count in the selected period.',
    country: 'Country', geography: 'Geographic breakdown', geoSub: 'Offline GeoIP estimates from up to 250 leading source addresses.',
    address: 'Source IP', attempts: 'Failed', total: 'Events',
    privateIP: 'Private network', noGeo: 'GeoIP not configured', unknown: 'Unknown',
    noCountry: 'No geolocated public IPs yet.', noResults: 'No events in this time window.',
    geoNote: 'GeoIP estimates the country of public IPs; VPNs and proxies can misrepresent physical origin.',
    geoSetup: 'GeoLite2 is not configured. Private network addresses have no public geographic location.',
    groups: 'Frequent event types', groupSub: 'Event counts by event_id in the selected time window.',
    sessions: 'SSH activity sessions', sessionsSub: 'Sessions grouped from Cowrie telemetry, newest first.',
    session: 'Session ID', from: 'Source', duration: 'Time', activity: 'Activity', state: 'State',
    closed: 'Closed', unfinished: 'No close event detected', lastEvent: 'Last event',
    noSession: 'No session data yet.',
    cmdTitle: 'Recent commands', cmdSubtitle: 'Only Cowrie command activity; login passwords are not shown.',
    noCmd: 'No commands collected yet.', alertOpen: 'Unclosed alerts', alertHigh: 'High-severity alerts',
    apiPending: 'Analytics API v4 unavailable', apiPendingSub: 'The existing interface is still available. Install the bundled FastAPI extension to enable charts and GeoIP.',
    period: 'Selected window', sample: 'PostgreSQL source', noName: 'Unavailable',
  },
}

function fmt(value, lang) { return Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US').format(Number(value) || 0) }
function timeText(value, lang) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.valueOf())) return '—'
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)
}

export function CountryName({ geo, lang = 'vi', compact = false }) {
  const t = COPY[lang] || COPY.vi
  if (!geo || geo.scope === 'unknown' || geo.scope === 'invalid') return <span className="geo-tag geo-tag--unknown">{t.unknown}</span>
  if (geo.scope === 'private') return <span className="geo-tag geo-tag--private">{t.privateIP}</span>
  if (geo.scope === 'not_configured') return <span className="geo-tag geo-tag--unknown">{t.noGeo}</span>
  if (!geo.country_code) return <span className="geo-tag geo-tag--unknown">{t.unknown}</span>
  let name = geo.country_en || geo.country_code
  try { name = new Intl.DisplayNames([lang === 'vi' ? 'vi' : 'en'], {type:'region'}).of(geo.country_code) || name } catch (_) { /* fall back to provider name */ }
  return <span className="geo-tag geo-tag--public" title={name}><span className="geo-tag__dot"/>{compact ? geo.country_code : name} <small>{compact ? '' : geo.country_code}</small></span>
}

function EventChart({ rows, lang }) {
  const t = COPY[lang]
  const w = 780, h = 240, x0 = 46, y0 = 21, right = 15, bottom = 33
  const graphW = w - x0 - right, graphH = h - y0 - bottom
  const counts = rows.map(x => Number(x.events) || 0)
  const fails = rows.map(x => Number(x.failed) || 0)
  const max = Math.max(1, ...counts, ...fails)
  const getX = i => x0 + graphW * (rows.length <= 1 ? 0 : i / (rows.length - 1))
  const getY = n => y0 + graphH - (n/max) * graphH
  const path = values => values.map((v,i) => `${i ? 'L' : 'M'} ${getX(i).toFixed(2)} ${getY(v).toFixed(2)}`).join(' ')
  const d = path(counts)
  const area = rows.length ? `${d} L ${getX(rows.length-1)} ${y0 + graphH} L ${getX(0)} ${y0 + graphH} Z` : ''
  const failPath = path(fails)
  const labels = rows.map((point,i) => ({...point,i})).filter(x => x.i === 0 || x.i === rows.length - 1 || x.i === Math.floor((rows.length - 1) * .25) || x.i === Math.floor((rows.length - 1) * .5) || x.i === Math.floor((rows.length - 1) * .75))
  return <div className="threat-chart">
    <div className="chart-legend"><span><i className="legend-dot"/>{t.events}</span><span><i className="legend-dot legend-dot--failed"/>{t.failed}</span></div>
    {rows.length === 0 ? <div className="threat-chart__empty">{t.noResults}</div> :
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t.heading}>
        <defs><linearGradient id="dauvet-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#64d6c6" stopOpacity=".22"/><stop offset="100%" stopColor="#64d6c6" stopOpacity=".006"/></linearGradient></defs>
        {[0,.25,.5,.75,1].map(p=><g key={p}><line x1={x0} x2={w-right} y1={y0+graphH*p} y2={y0+graphH*p} stroke="#315066" strokeDasharray="3 6"/><text x={x0-12} y={y0+graphH*p+4} textAnchor="end" fill="#8eb1c5" fontSize="12">{Math.round(max*(1-p))}</text></g>)}
        <path d={area} fill="url(#dauvet-chart-fill)"/><path d={d} fill="none" stroke="#68ddce" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><path d={failPath} fill="none" stroke="#f6a176" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {rows.map((point,i)=><g key={i}><circle cx={getX(i)} cy={getY(counts[i])} r="6" fill="transparent"><title>{`${point.label}: ${t.events} ${counts[i]}, ${t.failed} ${fails[i]}`}</title></circle></g>)}
        {labels.map(point=><text key={point.i} x={getX(point.i)} y={h-9} fill="#91b0c2" textAnchor={point.i === 0 ? 'start' : point.i === rows.length-1 ? 'end' : 'middle'} fontSize="11.5">{point.label}</text>)}
      </svg>}
  </div>
}

function TopSourceTable({ data, lang }) {
  const t = COPY[lang]
  const max = Math.max(1, ...data.map(x => Number(x.events) || 0))
  return <div className="intel-table-wrap"><table className="intel-table"><thead><tr><th>{t.address}</th><th>{t.country}</th><th>{t.attempts}</th><th>{t.events}</th></tr></thead><tbody>
    {data.map(source => <tr key={source.ip}><td><code>{source.ip}</code><span className="intel-meter"><i style={{width:`${100*(Number(source.events)||0)/max}%`}}/></span></td><td><CountryName geo={source} lang={lang}/></td><td className="intel-table__number">{fmt(source.failed,lang)}</td><td className="intel-table__number intel-table__strong">{fmt(source.events,lang)}</td></tr>)}
  </tbody></table>{data.length === 0 && <p className="intel-empty">{t.noResults}</p>}</div>
}

export function ActivityPanel({ intel, error, lang, windowValue, onWindowChange, compact = false }) {
  const t = COPY[lang] || COPY.vi
  if (!intel) return <div className="intel-panel intel-panel--placeholder"><h2>{t.apiPending}</h2><p>{t.apiPendingSub}</p>{error && <code>{error}</code>}</div>
  return <div className="analytics-suite">
    <section className="intel-panel intel-panel--chart">
      <header className="intel-panel__header"><div><span className="intel-eyebrow">TELEMETRY / TIME SERIES</span><h2>{t.heading}</h2><p>{t.caption}</p></div>
        <div className="intel-window" aria-label={t.range}><button className={windowValue === '24h' ? 'is-selected' : ''} onClick={()=>onWindowChange('24h')} type="button">{t.day}</button><button className={windowValue === '7d' ? 'is-selected' : ''} onClick={()=>onWindowChange('7d')} type="button">{t.week}</button></div>
      </header>
      <div className="intel-kpis">
        {[[t.events,intel.metrics?.events,'teal'],[t.ips,intel.metrics?.unique_ips,'blue'],[t.failed,intel.metrics?.failed,'coral'],[t.commands,intel.metrics?.commands,'neutral']].map(([label,value,tone])=><div key={label} className={`intel-kpi intel-kpi--${tone}`}><span>{label}</span><strong>{fmt(value,lang)}</strong></div>)}
      </div>
      <EventChart rows={intel.timeline || []} lang={lang}/>
      <div className="intel-panel__footer"><span>{t.period}: {windowValue === '24h' ? t.day : t.week}</span><span>{t.sample}</span></div>
    </section>
    <div className="intel-duo">
      <section className="intel-panel"><header className="intel-panel__header"><div><span className="intel-eyebrow">SOURCES / RANKING</span><h2>{t.topSources}</h2><p>{t.topSub}</p></div></header><TopSourceTable data={(intel.top_ips || []).slice(0,compact?5:12)} lang={lang}/></section>
      <section className="intel-panel"><header className="intel-panel__header"><div><span className="intel-eyebrow">{intel.geo_database_ready ? "GEOIP / ONLINE" : "GEOIP / OFFLINE"}</span><h2>{t.geography}</h2><p>{t.geoSub}</p></div></header>
        <div className="country-results">{(intel.countries || []).map(entry => <div className="country-result" key={entry.country_code}><span><CountryName lang={lang} geo={{country_code:entry.country_code,country_en:entry.country_en,scope:'public'}}/></span><strong>{fmt(entry.events,lang)} <small>{t.events.toLowerCase()}</small></strong></div>)}
          {(!intel.countries || intel.countries.length === 0) && <p className="intel-empty">{t.noCountry}</p>}
          {!intel.geo_database_ready && <p className="geo-explain">{t.geoSetup}</p>}
          <p className="geo-explain geo-explain--muted">{t.geoNote}</p>
          {intel.geo_database_ready && <p className="geo-explain geo-explain--muted">This product includes GeoLite2 data created by MaxMind, available from <a href="https://www.maxmind.com" target="_blank" rel="noopener noreferrer">maxmind.com</a>.</p>}
        </div>
      </section>
    </div>
    {!compact && <section className="intel-panel"><header className="intel-panel__header"><div><span className="intel-eyebrow">EVENTS / CLASSIFICATION</span><h2>{t.groups}</h2><p>{t.groupSub}</p></div></header><div className="event-type-grid">{(intel.event_types || []).map(entry=><div className="event-type" key={entry.event_id}><code>{entry.event_id}</code><strong>{fmt(entry.count,lang)}</strong></div>)}</div></section>}
  </div>
}

export function SessionsPanel({ sessions, commands, lang, loaded }) {
  const t = COPY[lang] || COPY.vi
  if (!loaded) return <div className="intel-panel intel-panel--placeholder"><h2>{t.apiPending}</h2><p>{t.apiPendingSub}</p></div>
  return <div className="analytics-suite">
    <section className="intel-panel"><header className="intel-panel__header"><div><span className="intel-eyebrow">SSH / SESSION INVESTIGATION</span><h2>{t.sessions}</h2><p>{t.sessionsSub}</p></div></header>
      <div className="intel-table-wrap"><table className="intel-table"><thead><tr><th>{t.session}</th><th>{t.from}</th><th>{t.country}</th><th>{t.activity}</th><th>{t.lastEvent}</th><th>{t.state}</th></tr></thead><tbody>
        {(sessions || []).map(row=><tr key={row.session_id}><td><code>{row.session_id}</code></td><td><code>{row.src_ip||'—'}</code></td><td><CountryName geo={row} lang={lang}/></td><td>{fmt(row.events,lang)} {t.events.toLowerCase()} · {fmt(row.commands,lang)} {t.commands.toLowerCase()}</td><td className="mono">{timeText(row.last_event_at,lang)}</td><td><span className={`session-status ${row.closed ? '' : 'session-status--pending'}`}>{row.closed ? t.closed : t.unfinished}</span></td></tr>)}
      </tbody></table>{(!sessions || sessions.length===0) && <p className="intel-empty">{t.noSession}</p>}</div>
    </section>
    <section className="intel-panel"><header className="intel-panel__header"><div><span className="intel-eyebrow">COWRIE / COMMAND TRACE</span><h2>{t.cmdTitle}</h2><p>{t.cmdSubtitle}</p></div></header>
      <div className="command-list">{(commands || []).map(row=><div className="command-row" key={row.id}><span className="mono">{timeText(row.event_time,lang)}</span><span className="mono">{row.src_ip || '—'}</span><code>{row.command || '—'}</code></div>)}{(!commands||commands.length===0) && <p className="intel-empty">{t.noCmd}</p>}</div>
    </section>
  </div>
}
