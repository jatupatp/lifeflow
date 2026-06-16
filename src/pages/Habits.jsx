import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Edit3, Trash2 } from 'lucide-react';
import { useHabits, useAllHabitLogs } from '../db/hooks';
import { getDateString, calculateStreak } from '../utils/helpers';
import { triggerConfetti, triggerHaptic } from '../utils/feedback';
import { useToast } from '../contexts/ToastContext';
import db from '../db/database';
import Card from '../components/UI/Card';
import FAB from '../components/UI/FAB';
import EmptyState from '../components/UI/EmptyState';
import Heatmap from '../components/Habits/Heatmap';
import HabitForm from '../components/Habits/HabitForm';
import './Habits.css';

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Habits() {
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const { showToast } = useToast();
  
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 90);
  const startDateString = getDateString(startDate);
  const endDateString = getDateString(today);
  
  const habitLogs = useAllHabitLogs(startDateString, endDateString);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const todayString = getDateString(new Date());

  const todayCheckedIds = useMemo(() => {
    if (!habitLogs) return new Set();
    return new Set(
      habitLogs.filter((l) => l.date === todayString).map((l) => l.habitId)
    );
  }, [habitLogs, todayString]);

  const getStreak = (habitId) => {
    if (!habitLogs) return 0;
    const habit = habits.find((h) => h.id === habitId);
    return calculateStreak(habitLogs, habitId, habit?.frequency);
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

  const handleSubmitForm = (habitData) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
      showToast(`อัปเดตกิจวัตร "${habitData.title}" แล้ว`, 'success');
    } else {
      addHabit(habitData);
      showToast(`เพิ่มกิจวัตรใหม่ "${habitData.title}" สำเร็จ`, 'success');
    }
    triggerHaptic(40);
    setShowForm(false);
    setEditingHabit(null);
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleDeleteHabit = async (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    const habitName = habit?.title || habit?.name || 'กิจวัตร';
    if (window.confirm('คุณต้องการลบกิจวัตรนี้ใช่หรือไม่? การลบนี้จะลบประวัติการเช็คอินทั้งหมดด้วย')) {
      await deleteHabit(habitId);
      showToast(`ลบกิจวัตร "${habitName}" เรียบร้อยแล้ว`, 'info');
      triggerHaptic(30);
    }
  };

  const isLoading = !habits || !habitLogs;

  if (isLoading) {
    return (
      <div className="habits-page">
        <div className="loading-skeleton">
          <div className="skeleton-line skeleton-lg" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card skeleton-card" style={{ height: 160, marginBottom: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <h1 className="habits-page-title">กิจวัตร</h1>

      {habits.length === 0 ? (
        <EmptyState
          title="ยังไม่มีกิจวัตร"
          description="เพิ่มกิจวัตรเพื่อสร้างนิสัยที่ดีและติดตามความสม่ำเสมอ"
          actionLabel="เพิ่มกิจวัตร"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>เพิ่มกิจวัตร</button>}
        />
      ) : (
        <motion.div
          className="habits-list"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {habits.map((habit) => {
            const isChecked = todayCheckedIds.has(habit.id);
            const streak = getStreak(habit.id);
            const habitColor = habit.color || 'var(--accent-primary)';

            return (
              <motion.div key={habit.id} variants={cardVariants}>
                <Card className="habit-card">
                  <div className="habit-card-header">
                    <div className="habit-card-left">
                      <span
                        className="habit-color-dot"
                        style={{ background: habitColor }}
                      />
                      <span className="habit-name">{habit.name}</span>
                    </div>
                    <div className="habit-card-right">
                      {streak > 0 && (
                        <span className="habit-streak">
                          🔥 {streak}
                        </span>
                      )}
                      <motion.button
                        className={`habit-checkin-btn ${isChecked ? 'checked' : ''}`}
                        onClick={() => handleCheckIn(habit.id)}
                        whileTap={{ scale: 0.85 }}
                        aria-label={isChecked ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}
                      >
                        <Check size={20} />
                      </motion.button>
                      <button
                        className="btn-icon btn-icon-sm"
                        onClick={() => handleEditHabit(habit)}
                        aria-label="แก้ไข"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn-icon btn-icon-sm"
                        onClick={() => handleDeleteHabit(habit.id)}
                        aria-label="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="habit-heatmap-section">
                    <Heatmap
                      habitId={habit.id}
                      logs={habitLogs}
                      color={habitColor}
                    />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <FAB icon={<Plus size={24} />} onClick={() => { setEditingHabit(null); setShowForm(true); }} label="เพิ่มกิจวัตร" />

      <AnimatePresence>
        {showForm && (
          <HabitForm
            habit={editingHabit}
            onSubmit={handleSubmitForm}
            onClose={() => { setShowForm(false); setEditingHabit(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
