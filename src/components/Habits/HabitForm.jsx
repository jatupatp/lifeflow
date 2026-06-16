import { useState } from 'react';
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

const FREQUENCIES = [
  { value: 'daily', label: 'ทุกวัน' },
  { value: 'weekly', label: 'ทุกสัปดาห์' },
];

export default function HabitForm({ habit, onSubmit, onClose }) {
  const isEditing = !!habit;

  const [name, setName] = useState(habit?.title || habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily');
  const [color, setColor] = useState(habit?.color || PRESET_COLORS[0].value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData = {
      title: name.trim(),
      name: name.trim(),
      description: description.trim(),
      frequency,
      color,
    };

    if (isEditing) {
      habitData.id = habit.id;
    }

    onSubmit?.(habitData);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'แก้ไขกิจวัตร' : 'เพิ่มกิจวัตรใหม่'}>
      <form onSubmit={handleSubmit} className="form">
        {/* Name */}
        <div className="form-group">
          <label className="form-label">ชื่อกิจวัตร *</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ออกกำลังกาย"
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
            placeholder="อธิบายกิจวัตรของคุณ..."
            rows={3}
          />
        </div>

        {/* Frequency */}
        <div className="form-group">
          <label className="form-label">ความถี่</label>
          <div className="frequency-selector">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`frequency-option ${frequency === f.value ? 'selected' : ''}`}
                onClick={() => setFrequency(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
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

        {/* Actions */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'บันทึก' : 'เพิ่มกิจวัตร'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
