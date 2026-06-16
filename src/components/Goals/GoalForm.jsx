import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { triggerHaptic } from '../../utils/feedback';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

const PRESET_COLORS = [
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
];

const emptyMilestone = () => ({
  id: crypto.randomUUID(),
  title: '',
  dueDate: '',
  completed: false,
});

export default function GoalForm({ goal, categories = [], addGoal, addCategory, onSubmit, onClose }) {
  const isEditing = !!goal;
  const { showToast } = useToast();

  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [categoryId, setCategoryId] = useState(goal?.categoryId || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [color, setColor] = useState(goal?.color || PRESET_COLORS[0].value);
  const [milestones, setMilestones] = useState(
    goal?.milestones?.length ? goal.milestones : []
  );

  const handleAddMilestone = () => {
    setMilestones((prev) => [...prev, emptyMilestone()]);
  };

  const handleRemoveMilestone = (id) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMilestoneChange = (id, field, value) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalCategoryId = categoryId;

    // Create new category if needed
    if (showNewCategory && newCategoryName.trim() && addCategory) {
      finalCategoryId = await addCategory({ name: newCategoryName.trim() });
    }

    const goalData = {
      title: title.trim(),
      description: description.trim(),
      categoryId: finalCategoryId || undefined,
      color,
    };

    const validMilestones = milestones
      .filter((m) => m.title.trim())
      .map((m, i) => ({
        title: m.title.trim(),
        dueDate: m.dueDate || '',
        completed: false,
        order: i,
      }));

    if (isEditing) {
      onSubmit?.({ ...goalData, id: goal.id }, validMilestones);
    } else if (addGoal) {
      const goalId = await addGoal(goalData);
      if (validMilestones.length > 0) {
        const db = (await import('../../db/database')).default;
        for (const ms of validMilestones) {
          await db.milestones.add({
            ...ms,
            goalId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      showToast(`สร้างเป้าหมาย "${goalData.title}" สำเร็จ!`, 'success');
      triggerHaptic(50);
    }

    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'แก้ไขเป้าหมาย' : 'สร้างเป้าหมายใหม่'}>
      <form onSubmit={handleSubmit} className="form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">ชื่อเป้าหมาย *</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น เรียนจบปริญญาโท"
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">รายละเอียด</label>
          <textarea
            className="input textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายเป้าหมายของคุณ..."
            rows={3}
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">หมวดหมู่</label>
          {!showNewCategory ? (
            <div className="form-row">
              <select
                className="input select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">ไม่ระบุ</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNewCategory(true)}
              >
                <Plus size={14} />
                ใหม่
              </button>
            </div>
          ) : (
            <div className="form-row">
              <input
                type="text"
                className="input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="ชื่อหมวดหมู่ใหม่"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName('');
                }}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>

        {/* Color Picker */}
        <div className="form-group">
          <label className="form-label">สี</label>
          <div className="color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-swatch ${color === c.value ? 'active' : ''}`}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="form-group">
          <label className="form-label">Milestones</label>
          <div className="milestones-list">
            {milestones.map((ms, index) => (
              <motion.div
                key={ms.id}
                className="milestone-form-item"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="milestone-form-row">
                  <span className="milestone-form-num">{index + 1}</span>
                  <input
                    type="text"
                    className="input"
                    value={ms.title}
                    onChange={(e) =>
                      handleMilestoneChange(ms.id, 'title', e.target.value)
                    }
                    placeholder="ชื่อ Milestone"
                  />
                  <div className="milestone-date-wrap">
                    <Calendar size={14} className="milestone-date-icon" />
                    <input
                      type="date"
                      className="input input-date"
                      value={ms.dueDate}
                      onChange={(e) =>
                        handleMilestoneChange(ms.id, 'dueDate', e.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-icon btn-icon-sm"
                    onClick={() => handleRemoveMilestone(ms.id)}
                    aria-label="ลบ Milestone"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddMilestone}
            style={{ marginTop: '0.5rem' }}
          >
            <Plus size={14} />
            เพิ่ม Milestone
          </button>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'บันทึก' : 'สร้างเป้าหมาย'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
