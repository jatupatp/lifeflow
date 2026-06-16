import { useState } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { getPriorityLabel } from '../../utils/helpers';

const PRIORITIES = ['high', 'medium', 'low'];

export default function TaskForm({ task, goals = [], currentDate, onSubmit, onClose }) {
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || currentDate || '');
  const [startTime, setStartTime] = useState(task?.startTime || '');
  const [endTime, setEndTime] = useState(task?.endTime || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [goalId, setGoalId] = useState(task?.goalId || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      startTime: startTime || null,
      endTime: endTime || null,
      priority,
      goalId: goalId ? Number(goalId) : null,
      status: task?.status || 'todo',
    };

    if (isEditing) {
      taskData.id = task.id;
    }

    onSubmit?.(taskData);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}>
      <form onSubmit={handleSubmit} className="form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">ชื่องาน *</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ส่งรายงานประจำสัปดาห์"
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
            placeholder="รายละเอียดเพิ่มเติม..."
            rows={3}
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">วันที่</label>
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Time (Optional) */}
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">เวลาเริ่ม (ไม่บังคับ)</label>
            <input
              type="time"
              className="input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">เวลาสิ้นสุด (ไม่บังคับ)</label>
            <input
              type="time"
              className="input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Priority */}
        <div className="form-group">
          <label className="form-label">ลำดับความสำคัญ</label>
          <div className="priority-selector">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={`priority-option priority-option-${p} ${priority === p ? 'selected' : ''}`}
                onClick={() => setPriority(p)}
              >
                {getPriorityLabel(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Link to Goal */}
        <div className="form-group">
          <label className="form-label">เชื่อมโยงเป้าหมาย</label>
          <select
            className="input select"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">ไม่เชื่อมโยง</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'บันทึก' : 'เพิ่มงาน'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
