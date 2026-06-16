import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getDay,
} from 'date-fns';
import { th } from 'date-fns/locale';
import { useEvents, useEventsByDateRange, useGoals, useTasks } from '../db/hooks';
import { getDateString } from '../utils/helpers';
import { triggerConfetti, triggerHaptic } from '../utils/feedback';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/UI/Modal';
import Card from '../components/UI/Card';
import FAB from '../components/UI/FAB';
import './Calendar.css';

const DAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const COLOR_PRESETS = [
  { name: 'teal', value: '#14b8a6' },
  { name: 'violet', value: '#8b5cf6' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'rose', value: '#f43f5e' },
  { name: 'emerald', value: '#10b981' },
  { name: 'sky', value: '#0ea5e9' },
  { name: 'orange', value: '#f97316' },
  { name: 'pink', value: '#ec4899' },
];

/* =============================================
   EventForm Modal
   ============================================= */
function EventForm({ isOpen, onClose, event, onSave, onDelete, selectedDate }) {
  const { goals } = useGoals();
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || (selectedDate ? getDateString(selectedDate) : getDateString(new Date())),
    startTime: event?.startTime || '09:00',
    endTime: event?.endTime || '10:00',
    color: event?.color || '#14b8a6',
    goalId: event?.goalId || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      goalId: form.goalId || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรม'} size="md">
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label className="form-label">ชื่อกิจกรรม</label>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="เช่น ประชุมทีม"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">รายละเอียด</label>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">วันที่</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">เวลาเริ่ม</label>
            <input
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">เวลาจบ</label>
            <input
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">สี</label>
          <div className="color-picker">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`color-swatch ${form.color === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setForm({ ...form, color: c.value })}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">เชื่อมโยงเป้าหมาย</label>
          <select
            className="select"
            value={form.goalId}
            onChange={(e) => setForm({ ...form, goalId: e.target.value })}
          >
            <option value="">ไม่เชื่อมโยง</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          {event && onDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onDelete(event.id);
                onClose();
              }}
            >
              <Trash2 size={16} />
              ลบ
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            {event ? 'บันทึก' : 'เพิ่มกิจกรรม'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =============================================
   MonthView
   ============================================= */
function MonthView({ currentDate, events, onDayClick, onEventClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = new Date();

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [events]);

  return (
    <div className="month-view">
      <div className="month-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="month-day-header">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const dateStr = getDateString(day);
          const dayEvents = eventsByDate[dateStr] || [];
          const isOther = !isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);

          return (
            <motion.div
              key={dateStr}
              className={`month-day ${isOther ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onDayClick(day)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.005 }}
              whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
            >
              <span className={`month-day-number ${isToday ? 'today-number' : ''}`}>
                {format(day, 'd')}
              </span>
              {dayEvents.length > 0 && (
                <div className="month-day-events">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <span
                      key={evt.id}
                      className="event-dot"
                      style={{
                        backgroundColor: evt.color || 'var(--accent-primary)',
                        opacity: evt.completed ? 0.35 : 1,
                        borderRadius: evt.isTask ? '2px' : '50%',
                      }}
                      title={evt.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(evt);
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="event-more">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* =============================================
   WeekView
   ============================================= */
function WeekView({ currentDate, events, onEventClick, onSlotClick }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [events]);

  return (
    <div className="week-view">
      <div className="week-header">
        <div className="week-time-gutter" />
        {days.map((day) => (
          <div
            key={getDateString(day)}
            className={`week-day-header ${isSameDay(day, today) ? 'today' : ''}`}
          >
            <span className="week-day-name">{DAY_NAMES[getDay(day)]}</span>
            <span className={`week-day-num ${isSameDay(day, today) ? 'today-number' : ''}`}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>
      <div className="week-body">
        {hours.map((hour) => (
          <div key={hour} className="week-row">
            <div className="week-time-label">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map((day) => {
              const dateStr = getDateString(day);
              const dayEvents = (eventsByDate[dateStr] || []).filter((evt) => {
                const h = parseInt(evt.startTime?.split(':')[0] || '0', 10);
                return h === hour;
              });
              return (
                <div
                  key={`${dateStr}-${hour}`}
                  className="week-cell"
                  onClick={() => {
                    const clickedDate = new Date(day);
                    clickedDate.setHours(hour);
                    onSlotClick(clickedDate);
                  }}
                >
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="week-event-block"
                      style={{
                        backgroundColor: evt.color || 'var(--accent-primary)',
                        opacity: evt.completed ? 0.5 : 1,
                        textDecoration: evt.completed ? 'line-through' : 'none',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(evt);
                      }}
                    >
                      <span className="week-event-title">{evt.title}</span>
                      <span className="week-event-time">
                        {evt.startTime} - {evt.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================================
   DayView
   ============================================= */
function DayView({ currentDate, events, onEventClick, onSlotClick }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();
  const dateStr = getDateString(currentDate);
  const isToday = isSameDay(currentDate, today);

  const dayEvents = useMemo(() => {
    return events.filter((evt) => evt.date === dateStr);
  }, [events, dateStr]);

  return (
    <div className="day-view">
      <div className="day-header-info">
        <h3 className={isToday ? 'gradient-text' : ''}>
          {format(currentDate, 'EEEE', { locale: th })}
        </h3>
        <span className="day-full-date">
          {format(currentDate, 'd MMMM yyyy', { locale: th })}
        </span>
      </div>
      <div className="day-timeline">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((evt) => {
            const h = parseInt(evt.startTime?.split(':')[0] || '0', 10);
            return h === hour;
          });

          return (
            <div
              key={hour}
              className="day-time-slot"
              onClick={() => {
                const clickedDate = new Date(currentDate);
                clickedDate.setHours(hour);
                onSlotClick(clickedDate);
              }}
            >
              <div className="day-time-label">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="day-time-content">
                {hourEvents.map((evt) => (
                  <motion.div
                    key={evt.id}
                    className="day-event-block"
                    style={{
                      backgroundColor: evt.color || 'var(--accent-primary)',
                      opacity: evt.completed ? 0.5 : 1,
                      textDecoration: evt.completed ? 'line-through' : 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(evt);
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="day-event-title">{evt.title}</div>
                    <div className="day-event-time">
                      <Clock size={12} />
                      {evt.startTime} - {evt.endTime}
                    </div>
                    {evt.description && (
                      <div className="day-event-desc">{evt.description}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =============================================
   Calendar Page
   ============================================= */
export default function Calendar() {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const { showToast } = useToast();

  // Fetch events for the visible range
  const rangeStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const rangeEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  
  const events = useEventsByDateRange(rangeStart, rangeEnd);
  const { addEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks, toggleTask } = useTasks();

  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const getHeaderLabel = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: th });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, 'd MMM', { locale: th })} - ${format(we, 'd MMM yyyy', { locale: th })}`;
    }
    return format(currentDate, 'd MMMM yyyy', { locale: th });
  };

  // Format tasks into calendar-friendly structures
  const taskCalendarItems = useMemo(() => {
    if (!tasks) return [];
    return tasks.map((t) => {
      let color = 'var(--sky)';
      if (t.priority === 'high') color = 'var(--rose)';
      else if (t.priority === 'medium') color = 'var(--amber)';
      
      return {
        id: `task-${t.id}`,
        dbId: t.id,
        title: `[งาน] ${t.title}`,
        date: t.dueDate,
        startTime: t.startTime || '00:00',
        endTime: t.endTime || '00:30',
        color,
        isTask: true,
        completed: t.status === 'done',
        rawTask: t,
      };
    });
  }, [tasks]);

  const combinedItems = useMemo(() => {
    return [...events, ...taskCalendarItems];
  }, [events, taskCalendarItems]);

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleSlotClick = (dateTime) => {
    setSelectedDate(dateTime);
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEventClick = (evt) => {
    setEditingEvent(evt);
    setSelectedDate(null);
    setShowForm(true);
  };

  const handleItemClick = async (item) => {
    if (item.isTask) {
      const newStatus = item.completed ? 'todo' : 'done';
      await toggleTask(item.dbId);
      if (newStatus === 'done') {
        showToast(`เสร็จสิ้นงาน "${item.rawTask.title}" 🎉`, 'success');
        triggerHaptic(50);
      } else {
        showToast(`ย้อนสถานะงาน "${item.rawTask.title}"`, 'info');
        triggerHaptic(30);
      }
    } else {
      handleEventClick(item);
    }
  };

  const handleSave = async (data) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      showToast(`อัปเดตกิจกรรม "${data.title}" สำเร็จ`, 'success');
      triggerHaptic(40);
    } else {
      await addEvent(data);
      showToast(`เพิ่มกิจกรรม "${data.title}" เรียบร้อยแล้ว`, 'success');
      triggerHaptic(50);
    }
  };

  const handleDelete = async (id) => {
    const title = editingEvent?.title || 'กิจกรรม';
    await deleteEvent(id);
    showToast(`ลบกิจกรรม "${title}" เรียบร้อยแล้ว`, 'info');
    triggerHaptic(30);
  };

  return (
    <div className="calendar-page page-container">
      {/* Header */}
      <div className="calendar-header animate-fade-in">
        <div className="calendar-header-left">
          <h1 className="page-title">
            <CalendarDays size={28} />
            ปฏิทิน
          </h1>
        </div>

        <div className="view-tabs">
          {[
            { key: 'month', label: 'เดือน' },
            { key: 'week', label: 'สัปดาห์' },
            { key: 'day', label: 'วัน' },
          ].map((v) => (
            <button
              key={v.key}
              className={`view-tab ${view === v.key ? 'active' : ''}`}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="calendar-nav animate-fade-in">
        <button className="btn btn-icon" onClick={goPrev}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="calendar-nav-label">{getHeaderLabel()}</h2>
        <button className="btn btn-icon" onClick={goNext}>
          <ChevronRight size={20} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={goToday}>
          วันนี้
        </button>
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={combinedItems}
              onDayClick={handleDayClick}
              onEventClick={handleItemClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={combinedItems}
              onEventClick={handleItemClick}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={combinedItems}
              onEventClick={handleItemClick}
              onSlotClick={handleSlotClick}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* FAB */}
      <FAB
        icon={<Plus size={24} />}
        onClick={() => {
          setEditingEvent(null);
          setSelectedDate(new Date());
          setShowForm(true);
        }}
        label="เพิ่มกิจกรรม"
      />

      {/* Event Form Modal */}
      {showForm && (
        <EventForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
            setSelectedDate(null);
          }}
          event={editingEvent}
          selectedDate={selectedDate}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
