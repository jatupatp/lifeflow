import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, CheckSquare, Flame, Repeat, Check, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';
import { useGoals, useTasksByDate, useHabits, useAllHabitLogs } from '../db/hooks';
import { getGreeting, getDateString, calculateStreak } from '../utils/helpers';
import { triggerConfetti, triggerHaptic } from '../utils/feedback';
import { useToast } from '../contexts/ToastContext';
import db from '../db/database';
import Card from '../components/UI/Card';
import EmptyState from '../components/UI/EmptyState';
import './Dashboard.css';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Dashboard() {
  const today = new Date();
  const todayString = getDateString(today);
  const { goals } = useGoals();
  const { tasks: todayTasks, addTask: addQuickTask, toggleTask } = useTasksByDate(todayString);
  const { habits } = useHabits();
  const { showToast } = useToast();

  const startDate = new Date();
  startDate.setDate(today.getDate() - 90);
  const startDateString = getDateString(startDate);
  const endDateString = getDateString(today);
  
  const habitLogs = useAllHabitLogs(startDateString, endDateString);

  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const isLoading = !goals || !todayTasks || !habits || !habitLogs;

  const stats = useMemo(() => {
    if (isLoading) return { activeGoals: 0, tasksCompleted: 0, tasksTotal: 0, maxStreak: 0, habitsCompleted: 0, habitsTotal: 0 };

    const activeGoals = goals.filter((g) => g.status === 'active').length;
    const tasksCompleted = todayTasks.filter((t) => t.status === 'done').length;
    const tasksTotal = todayTasks.length;
    const habitsTotal = habits.length;

    const todayLogs = habitLogs.filter((l) => l.date === todayString);
    const habitsCompleted = new Set(todayLogs.map((l) => l.habitId)).size;

    let maxStreak = 0;
    habits.forEach((habit) => {
      const streak = calculateStreak(habitLogs, habit.id, habit.frequency);
      if (streak > maxStreak) maxStreak = streak;
    });

    return { activeGoals, tasksCompleted, tasksTotal, maxStreak, habitsCompleted, habitsTotal };
  }, [goals, todayTasks, habits, habitLogs, todayString, isLoading]);

  const todayHabitLogIds = useMemo(() => {
    if (!habitLogs) return new Set();
    return new Set(habitLogs.filter((l) => l.date === todayString).map((l) => l.habitId));
  }, [habitLogs, todayString]);

  const handleQuickAddTask = (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addQuickTask({ title: quickTaskTitle.trim(), priority: 'medium' });
    showToast(`เพิ่มงานด่วน "${quickTaskTitle.trim()}" แล้ว`, 'success');
    triggerHaptic(40);
    setQuickTaskTitle('');
  };

  const handleToggleTask = async (taskId) => {
    const task = todayTasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    await toggleTask(taskId);
    
    if (newStatus === 'done') {
      showToast(`เสร็จสิ้นงาน "${task.title}" 🎉`, 'success');
      triggerHaptic(50);
      
      const allDone = todayTasks.every((t) => t.id === taskId || t.status === 'done');
      if (allDone && todayTasks.length > 0) {
        triggerConfetti();
        showToast('ยอดเยี่ยม! คุณทำงานของวันนี้ครบทั้งหมดแล้ว 🌟', 'success');
      }
    } else {
      showToast(`ย้อนสถานะงาน "${task.title}"`, 'info');
      triggerHaptic(30);
    }
  };

  const handleCheckIn = async (habitId) => {
    const existing = await db.habitLogs
      .where('[habitId+date]')
      .equals([habitId, todayString])
      .first();

    const habit = habits.find((h) => h.id === habitId);
    const habitName = habit?.title || habit?.name || 'กิจวัตร';

    if (existing) {
      await db.habitLogs.delete(existing.id);
      showToast(`ยกเลิกเช็คอิน "${habitName}"`, 'info');
      triggerHaptic(30);
    } else {
      await db.habitLogs.add({
        habitId,
        date: todayString,
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showToast(`เช็คอิน "${habitName}" สำเร็จ! 🔥`, 'success');
      triggerHaptic(50);
      
      const todayLogs = await db.habitLogs.where('date').equals(todayString).toArray();
      const completedIds = new Set(todayLogs.map((l) => l.habitId));
      const allDone = habits.every((h) => h.id === habitId || completedIds.has(h.id));
      if (allDone && habits.length > 0) {
        triggerConfetti();
        showToast('ยอดเยี่ยม! คุณทำกิจวัตรของวันนี้ครบถ้วนแล้ว 🎉', 'success');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading-skeleton">
          <div className="skeleton-line skeleton-lg" />
          <div className="skeleton-line skeleton-sm" />
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card skeleton-card" style={{ height: 100 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <h1 className="dashboard-greeting">{getGreeting()}</h1>
        <p className="dashboard-date">
          {format(today, 'วันEEEEที่ d MMMM yyyy', { locale: th })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="stats-grid" variants={itemVariants}>
        <Card className="stat-card">
          <div className="stat-card-icon teal">
            <Target size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.activeGoals}</span>
            <span className="stat-card-label">เป้าหมาย</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-card-icon violet">
            <CheckSquare size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {stats.tasksCompleted}/{stats.tasksTotal}
            </span>
            <span className="stat-card-label">งานวันนี้</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-card-icon amber">
            <Flame size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.maxStreak}</span>
            <span className="stat-card-label">Streak สูงสุด</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-card-icon emerald">
            <Repeat size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {stats.habitsCompleted}/{stats.habitsTotal}
            </span>
            <span className="stat-card-label">กิจวัตรวันนี้</span>
          </div>
        </Card>
      </motion.div>

      {/* Widgets */}
      <div className="dashboard-widgets">
        {/* Today's Tasks Widget */}
        <motion.div variants={itemVariants}>
          <Card className="widget">
            <div className="widget-header">
              <span className="widget-title">งานวันนี้</span>
              <Link to="/tasks" className="widget-link">ดูทั้งหมด</Link>
            </div>
            <div className="widget-body">
              {todayTasks.length === 0 ? (
                <p className="text-secondary text-sm">ไม่มีงานสำหรับวันนี้</p>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="task-quick-item">
                    <span className={`task-quick-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={() => handleToggleTask(task.id)}
                    >
                      {task.status === 'done' && <Check size={12} color="#fff" />}
                    </span>
                    <span className={`task-quick-title ${task.status === 'done' ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
              <form className="task-quick-add" onSubmit={handleQuickAddTask}>
                <input
                  type="text"
                  className="input"
                  placeholder="เพิ่มงานด่วน..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                </button>
              </form>
            </div>
          </Card>
        </motion.div>

        {/* Recent Goals Widget */}
        <motion.div variants={itemVariants}>
          <Card className="widget">
            <div className="widget-header">
              <span className="widget-title">เป้าหมายล่าสุด</span>
              <Link to="/goals" className="widget-link">ดูทั้งหมด</Link>
            </div>
            <div className="widget-body">
              {goals.length === 0 ? (
                <p className="text-secondary text-sm">ยังไม่มีเป้าหมาย</p>
              ) : (
                goals.slice(0, 3).map((goal) => {
                  const milestones = goal.milestones || [];
                  const completed = milestones.filter((m) => m.completed).length;
                  const total = milestones.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div key={goal.id} className="goal-quick-item">
                      <div className="goal-quick-name">{goal.title}</div>
                      <div className="goal-quick-progress">
                        <div className="goal-quick-bar">
                          <div
                            className="goal-quick-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="goal-quick-text">
                          {completed}/{total}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Today's Habits Widget */}
        <motion.div variants={itemVariants}>
          <Card className="widget">
            <div className="widget-header">
              <span className="widget-title">กิจวัตรวันนี้</span>
              <Link to="/habits" className="widget-link">ดูทั้งหมด</Link>
            </div>
            <div className="widget-body">
              {habits.length === 0 ? (
                <p className="text-secondary text-sm">ยังไม่มีกิจวัตร</p>
              ) : (
                habits.slice(0, 5).map((habit) => {
                  const isDone = todayHabitLogIds.has(habit.id);
                  return (
                    <div key={habit.id} className="habit-quick-item">
                      <span className="habit-quick-name">{habit.title || habit.name}</span>
                      <span
                        className={`habit-quick-check ${isDone ? 'checked' : ''}`}
                        onClick={() => handleCheckIn(habit.id)}
                        role="button"
                        aria-label={isDone ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}
                      >
                        {isDone && <Check size={16} />}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
