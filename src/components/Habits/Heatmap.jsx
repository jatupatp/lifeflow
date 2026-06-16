import { useState, useMemo } from 'react';
import { format, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale/th';
import './Heatmap.css';

const DAY_LABELS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

export default function Heatmap({ habitId, logs = [], weeks = 12, color }) {
  const [hoveredDate, setHoveredDate] = useState(null);

  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 });

    // Build a set of dates with activity
    const logDates = new Set(
      logs
        .filter((l) => l.habitId === habitId)
        .map((l) => l.date)
    );

    // Generate grid of days
    const days = [];
    const totalDays = weeks * 7;
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      days.push({
        date,
        dateStr,
        hasActivity: logDates.has(dateStr),
      });
    }

    return days;
  }, [habitId, logs, weeks]);

  return (
    <div className="heatmap">
      <div className="heatmap-container">
        <div className="heatmap-labels">
          {DAY_LABELS.map((label) => (
            <span key={label} className="heatmap-label">
              {label}
            </span>
          ))}
        </div>
        <div className="heatmap-grid">
          {heatmapData.map((day) => (
            <div
              key={day.dateStr}
              className={`heatmap-cell ${day.hasActivity ? 'level-1' : 'level-0'}`}
              style={
                day.hasActivity && color
                  ? { background: color }
                  : undefined
              }
              onMouseEnter={() => setHoveredDate(day.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {hoveredDate === day.dateStr && (
                <span className="heatmap-tooltip">
                  {format(day.date, 'd MMM yyyy', { locale: th })}
                  {day.hasActivity ? ' ✓' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
