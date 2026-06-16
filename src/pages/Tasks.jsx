import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plus, Edit3, Trash2 } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { th } from 'date-fns/locale/th';
import { useTasksByDate, useGoals } from '../db/hooks';
import { getDateString, getPriorityLabel, getPriorityColor } from '../utils/helpers';
import { triggerConfetti, triggerHaptic } from '../utils/feedback';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/UI/Card';
import FAB from '../components/UI/FAB';
import EmptyState from '../components/UI/EmptyState';
import TaskForm from '../components/Tasks/TaskForm';
import './Tasks.css';

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

export default function Tasks() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');

  const { showToast } = useToast();
  const dateString = getDateString(currentDate);
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasksByDate(dateString);
  const { goals } = useGoals();

  const isLoading = !tasks;

  const groupedTasks = useMemo(() => {
    if (!tasks) return { high: [], medium: [], low: [] };
    const groups = { high: [], medium: [], low: [] };
    tasks.forEach((task) => {
      const p = task.priority || 'medium';
      if (groups[p]) groups[p].push(task);
      else groups.medium.push(task);
    });
    return groups;
  }, [tasks]);

  const goToPrev = () => setCurrentDate((d) => subDays(d, 1));
  const goToNext = () => setCurrentDate((d) => addDays(d, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await toggleTask(task.id);
    
    if (newStatus === 'done') {
      showToast(`เสร็จสิ้นงาน "${task.title}" 🎉`, 'success');
      triggerHaptic(50);
      
      const allDone = tasks.every((t) => t.id === task.id || t.status === 'done');
      if (allDone && tasks.length > 0 && isToday(currentDate)) {
        triggerConfetti();
        showToast('ยอดเยี่ยม! คุณทำงานของวันนี้ครบทั้งหมดแล้ว 🌟', 'success');
      }
    } else {
      showToast(`ย้อนสถานะงาน "${task.title}"`, 'info');
      triggerHaptic(30);
    }
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({ title: quickTitle.trim(), priority: quickPriority });
    showToast(`เพิ่มงานด่วน "${quickTitle.trim()}" สำเร็จ`, 'success');
    triggerHaptic(40);
    setQuickTitle('');
  };

  const handleSubmitForm = (taskData) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      showToast(`อัปเดตงาน "${taskData.title}" สำเร็จ`, 'success');
    } else {
      addTask(taskData);
      showToast(`เพิ่มงานใหม่ "${taskData.title}" สำเร็จ`, 'success');
    }
    triggerHaptic(40);
    setShowForm(false);
    setEditingTask(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const taskTitle = task ? task.title : 'งาน';
    deleteTask(taskId);
    showToast(`ลบงาน "${taskTitle}" เรียบร้อยแล้ว`, 'info');
    triggerHaptic(30);
  };

  const prioritySections = [
    { key: 'high', label: 'สูง', tasks: groupedTasks.high },
    { key: 'medium', label: 'กลาง', tasks: groupedTasks.medium },
    { key: 'low', label: 'ต่ำ', tasks: groupedTasks.low },
  ];

  if (isLoading) {
    return (
      <div className="tasks-page">
        <div className="loading-skeleton">
          <div className="skeleton-line skeleton-lg" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card skeleton-card" style={{ height: 56, marginBottom: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <h1 className="tasks-page-title">งานประจำวัน</h1>

      {/* Date Navigator */}
      <div className="date-nav">
        <button className="date-nav-btn" onClick={goToPrev} aria-label="วันก่อนหน้า">
          <ChevronLeft size={18} />
        </button>
        <span className="date-nav-label">
          {format(currentDate, 'วันEEEEที่ d MMMM yyyy', { locale: th })}
        </span>
        <button className="date-nav-btn" onClick={goToNext} aria-label="วันถัดไป">
          <ChevronRight size={18} />
        </button>
        {!isToday(currentDate) && (
          <button className="date-nav-today" onClick={goToToday}>
            วันนี้
          </button>
        )}
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <EmptyState
          title="ไม่มีงานสำหรับวันนี้"
          description="เพิ่มงานใหม่เพื่อเริ่มจัดการวันของคุณ"
          actionLabel="เพิ่มงาน"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>เพิ่มงาน</button>}
        />
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible">
          {prioritySections.map(
            (section) =>
              section.tasks.length > 0 && (
                <div key={section.key} className="task-section">
                  <div className="task-section-title">
                    ลำดับความสำคัญ: {section.label}
                  </div>
                  <div className="task-list">
                    {section.tasks.map((task) => (
                      <motion.div key={task.id} variants={itemVariants}>
                        <Card
                          className={`task-item ${task.status === 'done' ? 'completed' : ''}`}
                        >
                          <button
                            className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(task);
                            }}
                            aria-label={task.status === 'done' ? 'ยกเลิกทำเสร็จ' : 'ทำเสร็จ'}
                          >
                            {task.status === 'done' && <Check size={14} color="#fff" />}
                          </button>
                          <div className="task-info" onClick={() => handleEditTask(task)}>
                            <span className="task-title">{task.title}</span>
                          </div>
                          <span
                            className={`priority-badge priority-${task.priority || 'medium'}`}
                          >
                            {getPriorityLabel(task.priority || 'medium')}
                          </span>
                          <div className="task-item-actions">
                            <button
                              className="btn-icon btn-icon-sm"
                              onClick={() => handleEditTask(task)}
                              aria-label="แก้ไข"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn-icon btn-icon-sm"
                              onClick={() => handleDeleteTask(task.id)}
                              aria-label="ลบ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
          )}
        </motion.div>
      )}

      {/* Quick Add */}
      <form className="quick-add" onSubmit={handleQuickAdd}>
        <input
          type="text"
          className="input quick-add-input"
          placeholder="เพิ่มงานด่วน..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />
        <div className="quick-add-priority">
          {['high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              type="button"
              className={`quick-add-priority-btn ${quickPriority === p ? 'selected' : ''}`}
              onClick={() => setQuickPriority(p)}
            >
              {getPriorityLabel(p)}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary quick-add-btn">
          <Plus size={16} />
        </button>
      </form>

      <FAB icon={<Plus size={24} />} onClick={() => { setEditingTask(null); setShowForm(true); }} label="เพิ่มงาน" />

      <AnimatePresence>
        {showForm && (
          <TaskForm
            task={editingTask}
            goals={goals || []}
            currentDate={dateString}
            onSubmit={handleSubmitForm}
            onClose={() => { setShowForm(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
