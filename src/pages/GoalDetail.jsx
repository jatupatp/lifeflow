import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit3, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';
import { useGoal, useGoals, useCategories } from '../db/hooks';
import { triggerConfetti, triggerHaptic } from '../utils/feedback';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import GoalForm from '../components/Goals/GoalForm';
import './GoalDetail.css';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const {
    goal,
    milestones,
    progress,
    updateGoal,
    updateMilestone,
  } = useGoal(Number(id));
  
  const { categories } = useCategories();
  const { deleteGoal } = useGoals();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (goal === undefined) {
    return (
      <div className="goal-detail">
        <div className="loading-skeleton">
          <div className="skeleton-line skeleton-lg" />
          <div className="skeleton-line skeleton-md" />
          <div className="skeleton-line skeleton-sm" />
        </div>
      </div>
    );
  }

  if (goal === null) {
    return (
      <div className="goal-detail">
        <button className="goal-detail-back" onClick={() => navigate('/goals')}>
          <ArrowLeft size={18} />
          กลับ
        </button>
        <Card className="progress-summary">
          <p className="text-secondary">ไม่พบเป้าหมายนี้</p>
        </Card>
      </div>
    );
  }

  const completedCount = milestones.filter((m) => m.completed).length;
  const totalCount = milestones.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const goalColor = goal.color || 'var(--accent-primary)';

  // Determine current milestone (first uncompleted)
  const currentIndex = milestones.findIndex((m) => !m.completed);

  const handleToggleMilestone = (milestoneId) => {
    const ms = milestones.find((m) => m.id === milestoneId);
    if (ms) {
      const newCompleted = !ms.completed;
      updateMilestone(milestoneId, { completed: newCompleted });
      
      if (newCompleted) {
        showToast(`เสร็จสิ้นเป้าหมายย่อย "${ms.title}" 🎉`, 'success');
        triggerHaptic(50);
        
        const allDone = milestones.every((m) => m.id === milestoneId || m.completed);
        if (allDone && milestones.length > 0) {
          triggerConfetti();
          showToast(`ยินดีด้วย! คุณทำเป้าหมาย "${goal.title}" สำเร็จครบ 100% แล้ว! 🏆`, 'success');
        }
      } else {
        showToast(`ย้อนสถานะเป้าหมายย่อย "${ms.title}"`, 'info');
        triggerHaptic(30);
      }
    }
  };

  const handleEditSubmit = async (goalData, newMilestones) => {
    await updateGoal(goalData);

    // Update milestones in Dexie
    const db = (await import('../db/database')).default;
    
    // 1. Delete existing milestones for this goal
    await db.milestones.where('goalId').equals(Number(id)).delete();

    // 2. Add new milestones list
    if (newMilestones && newMilestones.length > 0) {
      for (const ms of newMilestones) {
        await db.milestones.add({
          ...ms,
          goalId: Number(id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    showToast(`อัปเดตข้อมูลเป้าหมาย "${goalData.title}" สำเร็จ`, 'success');
    triggerHaptic(40);
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    const goalTitle = goal.title;
    await deleteGoal(Number(id));
    showToast(`ลบเป้าหมาย "${goalTitle}" เรียบร้อยแล้ว`, 'info');
    triggerHaptic(30);
    navigate('/goals');
  };

  return (
    <motion.div
      className="goal-detail"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <button className="goal-detail-back" onClick={() => navigate('/goals')}>
        <ArrowLeft size={18} />
        กลับไปยังเป้าหมาย
      </button>

      {/* Header */}
      <div className="goal-detail-header">
        <div className="goal-detail-info" style={{ display: 'flex' }}>
          <div
            className="goal-detail-color-bar"
            style={{ background: goalColor }}
          />
          <div>
            <h1 className="goal-detail-title">{goal.title}</h1>
            {goal.description && (
              <p className="goal-detail-desc">{goal.description}</p>
            )}
            <div className="goal-detail-meta">
              {goal.categoryName && <Badge>{goal.categoryName}</Badge>}
              <Badge variant="outline">{completedCount}/{totalCount} สำเร็จ</Badge>
            </div>
          </div>
        </div>
        <div className="goal-detail-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEditForm(true)}
          >
            <Edit3 size={16} />
            แก้ไข
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} />
            ลบ
          </Button>
        </div>
      </div>

      {/* Milestone Timeline */}
      {milestones.length > 0 && (
        <div className="milestone-timeline">
          <div className="milestone-line" />
          {milestones.map((ms, index) => {
            let status = 'future';
            if (ms.completed) status = 'completed';
            else if (index === currentIndex) status = 'current';

            return (
              <motion.div
                key={ms.id}
                className="milestone-item"
                onClick={() => handleToggleMilestone(ms.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`milestone-dot ${status}`}>
                  {ms.completed && <Check size={12} />}
                </div>
                <div className="milestone-content">
                  <div className={`milestone-title ${ms.completed ? 'completed' : ''}`}>
                    {ms.title}
                  </div>
                  {ms.dueDate && (
                    <div className="milestone-date">
                      กำหนดเสร็จ: {format(new Date(ms.dueDate), 'd MMM yyyy', { locale: th })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Progress Summary */}
      <Card className="progress-summary">
        <div className="progress-summary-value">{pct}%</div>
        <div className="progress-summary-label">
          {completedCount} จาก {totalCount} สำเร็จ
        </div>
        <div className="progress-bar-lg">
          <div
            className="progress-bar-lg-fill"
            style={{ width: `${pct}%`, background: goalColor }}
          />
        </div>
      </Card>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditForm && (
          <GoalForm
            goal={goal}
            categories={categories || []}
            onSubmit={handleEditSubmit}
            onClose={() => setShowEditForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <Modal isOpen={true} onClose={() => setShowDeleteConfirm(false)} title="ยืนยันการลบ">
            <div className="delete-confirm">
              <p className="delete-confirm-text">
                คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมาย &quot;{goal.title}&quot;?
                <br />
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="delete-confirm-actions">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  ยกเลิก
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  ลบเป้าหมาย
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
