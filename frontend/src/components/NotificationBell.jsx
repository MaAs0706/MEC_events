import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './NotificationBell.css'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ items: [], unread_count: 0 })
  const navigate = useNavigate()
  const load = async () => { try { setData((await api.get('/notifications')).data) } catch { return null } }
  useEffect(() => { const initial = setTimeout(load, 0); const id = setInterval(load, 30000); return () => { clearTimeout(initial); clearInterval(id) } }, [])
  const openItem = async (item) => { if (!item.is_read) { await api.patch(`/notifications/${item.id}/read`); await load() }; setOpen(false); if (item.link) navigate(item.link) }
  return <div className="notification-bell"><button className="icon-btn" title="Notifications" onClick={() => { setOpen(!open); if (!open) load() }}><Bell size={18} />{data.unread_count > 0 && <span className="notification-count">{data.unread_count > 9 ? '9+' : data.unread_count}</span>}</button>{open && <div className="notification-menu"><div className="notification-menu-head"><strong>Notifications</strong>{data.unread_count > 0 && <button onClick={async () => { await api.patch('/notifications/read-all'); load() }}>Mark all read</button>}</div>{data.items.length ? data.items.map(item => <button className={`notification-item ${item.is_read ? '' : 'unread'}`} key={item.id} onClick={() => openItem(item)}><strong>{item.title}</strong><span>{item.message}</span></button>) : <p>No notifications yet.</p>}</div>}</div>
}
