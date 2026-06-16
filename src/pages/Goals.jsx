import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, List, Plus } from 'lucide-react';
import { useGoals, useCategories } from '../db/hooks';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import FAB from '../components/UI/FAB';
import EmptyState from '../components/UI/EmptyState';
import GoalForm from '../components/Goals/GoalForm';
import './Goals.css';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Goals() {
  const { goals, addGoal } = useGoals();
  const { categories, addCategory } = useCategories();
  const navigate = useNavigate();

  const [view, setView] = useState('grid');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filteredGoals = useMemo(() => {
    if (!goals) return [];
    if (categoryFilter === 'all') return goals;
    return goals.filter((g) => g.categoryId === Number(categoryFilter));
  }, [goals, categoryFilter]);

  if (!goals || !categories) {
    return (
      <div className="goals-page">
        <div className="loading-skeleton">
          <div className="skeleton-line skeleton-lg" />
          <div className="goals-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card skeleton-card" style={{ height: 160 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="goals-page-header">
        <h1 className="goals-page-title">เป้าหมาย</h1>
        <div className="goals-filters">
          <select
            className="goals-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
              aria-label="มุมมองกริด"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              aria-label="มุมมองรายการ"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <EmptyState
          title="ยังไม่มีเป้าหมาย"
          description="เริ่มสร้างเป้าหมายแรกของคุณเพื่อติดตามความก้าวหน้า"
          actionLabel="สร้างเป้าหมาย"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>สร้างเป้าหมาย</button>}
        />
      ) : (
        <motion.div
          className={view === 'grid' ? 'goals-grid' : 'goals-list'}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredGoals.map((goal) => {
            const milestones = goal.milestones || [];
            const completed = milestones.filter((m) => m.completed).length;
            const total = milestones.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const goalColor = goal.color || 'var(--accent-primary)';

            return (
              <motion.div key={goal.id} variants={cardVariants}>
                <Card
                  className="goal-card"
                  style={{ borderTopColor: goalColor }}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                >
                  <div className="goal-card-title">{goal.title}</div>
                  {goal.description && (
                    <div className="goal-card-desc">{goal.description}</div>
                  )}
                  <div className="goal-card-footer">
                    {goal.categoryName && (
                      <Badge>{goal.categoryName}</Badge>
                    )}
                    <div className="goal-card-progress-wrap">
                      <div className="goal-progress-bar">
                        <div
                          className="goal-progress-fill"
                          style={{ width: `${pct}%`, background: goalColor }}
                        />
                      </div>
                      <span className="goal-progress-text">
                        {completed}/{total}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <FAB icon={<Plus size={24} />} onClick={() => setShowForm(true)} label="สร้างเป้าหมาย" />

      <AnimatePresence>
        {showForm && (
          <GoalForm
            onClose={() => setShowForm(false)}
            categories={categories}
            addGoal={addGoal}
            addCategory={addCategory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
