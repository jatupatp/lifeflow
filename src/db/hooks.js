import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import db from './database';

/* ============================================
   Helper — timestamp fields
   ============================================ */
function withTimestamps(data) {
  const now = new Date().toISOString();
  return { ...data, createdAt: now, updatedAt: now };
}

function withUpdatedAt(data) {
  return { ...data, updatedAt: new Date().toISOString() };
}

/* ============================================
   useCategories
   ============================================ */
export function useCategories() {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

  const addCategory = async (data) => {
    return db.categories.add(withTimestamps(data));
  };

  const updateCategory = async (id, changes) => {
    return db.categories.update(id, withUpdatedAt(changes));
  };

  const deleteCategory = async (id) => {
    return db.categories.delete(id);
  };

  return { categories, addCategory, updateCategory, deleteCategory };
}

/* ============================================
   useGoals
   ============================================ */
export function useGoals(categoryId) {
  const goals = useLiveQuery(async () => {
    let list;
    if (categoryId !== undefined && categoryId !== null) {
      list = await db.goals.where('categoryId').equals(categoryId).toArray();
    } else {
      list = await db.goals.toArray();
    }

    const categories = await db.categories.toArray();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const goalsWithData = await Promise.all(
      list.map(async (goal) => {
        const milestones = await db.milestones
          .where('goalId')
          .equals(goal.id)
          .toArray();
        return {
          ...goal,
          milestones,
          categoryName: categoryMap.get(goal.categoryId) || null,
        };
      })
    );

    return goalsWithData;
  }, [categoryId]) ?? [];

  const addGoal = async (data) => {
    return db.goals.add(
      withTimestamps({
        status: 'active',
        ...data,
      })
    );
  };

  const updateGoal = async (id, changes) => {
    return db.goals.update(id, withUpdatedAt(changes));
  };

  const deleteGoal = async (id) => {
    // Also remove related milestones
    await db.milestones.where('goalId').equals(id).delete();
    return db.goals.delete(id);
  };

  return { goals, addGoal, updateGoal, deleteGoal };
}

/* ============================================
   useGoal (single)
   ============================================ */
export function useGoal(id) {
  const goal = useLiveQuery(async () => {
    if (id === undefined || id === null) return null;
    const res = await db.goals.get(id);
    return res || null;
  }, [id]);

  const milestones = useLiveQuery(() => {
    if (id === undefined || id === null) return [];
    return db.milestones
      .where('goalId')
      .equals(id)
      .sortBy('order');
  }, [id]) ?? [];

  const progress = milestones.length > 0
    ? Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)
    : 0;

  const updateGoal = async (changes) => {
    if (id === undefined || id === null) return;
    return db.goals.update(id, withUpdatedAt(changes));
  };

  const addMilestone = async (data) => {
    return db.milestones.add(
      withTimestamps({
        goalId: id,
        completed: false,
        order: milestones.length,
        ...data,
      })
    );
  };

  const updateMilestone = async (milestoneId, changes) => {
    return db.milestones.update(milestoneId, withUpdatedAt(changes));
  };

  const deleteMilestone = async (milestoneId) => {
    return db.milestones.delete(milestoneId);
  };

  return {
    goal,
    milestones,
    progress,
    updateGoal,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  };
}

/* ============================================
   useTasks
   ============================================ */
export function useTasks(filters) {
  const tasks = useLiveQuery(() => {
    let collection = db.tasks.toCollection();

    if (filters?.status) {
      collection = db.tasks.where('status').equals(filters.status);
    }
    if (filters?.priority) {
      collection = db.tasks.where('priority').equals(filters.priority);
    }
    if (filters?.goalId) {
      collection = db.tasks.where('goalId').equals(filters.goalId);
    }

    return collection.toArray();
  }, [filters?.status, filters?.priority, filters?.goalId]) ?? [];

  const addTask = async (data) => {
    return db.tasks.add(
      withTimestamps({
        status: 'todo',
        ...data,
      })
    );
  };

  const updateTask = async (id, changes) => {
    return db.tasks.update(id, withUpdatedAt(changes));
  };

  const deleteTask = async (id) => {
    return db.tasks.delete(id);
  };

  const toggleTask = async (id) => {
    const task = await db.tasks.get(id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    return db.tasks.update(id, withUpdatedAt({ status: newStatus }));
  };

  return { tasks, addTask, updateTask, deleteTask, toggleTask };
}

/* ============================================
   useTasksByDate
   ============================================ */
export function useTasksByDate(date) {
  const dateString = date ? format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd') : null;

  const tasks = useLiveQuery(() => {
    if (!dateString) return [];
    return db.tasks.where('dueDate').equals(dateString).toArray();
  }, [dateString]) ?? [];

  const addTask = async (data) => {
    return db.tasks.add(
      withTimestamps({
        status: 'todo',
        dueDate: dateString,
        ...data,
      })
    );
  };

  const updateTask = async (id, changes) => {
    return db.tasks.update(id, withUpdatedAt(changes));
  };

  const deleteTask = async (id) => {
    return db.tasks.delete(id);
  };

  const toggleTask = async (id) => {
    const task = await db.tasks.get(id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    return db.tasks.update(id, withUpdatedAt({ status: newStatus }));
  };

  return { tasks, addTask, updateTask, deleteTask, toggleTask };
}

/* ============================================
   useHabits
   ============================================ */
export function useHabits() {
  const habits = useLiveQuery(() => db.habits.toArray()) ?? [];

  const addHabit = async (data) => {
    return db.habits.add(withTimestamps(data));
  };

  const updateHabit = async (id, changes) => {
    return db.habits.update(id, withUpdatedAt(changes));
  };

  const deleteHabit = async (id) => {
    // Also remove related logs
    await db.habitLogs.where('habitId').equals(id).delete();
    return db.habits.delete(id);
  };

  return { habits, addHabit, updateHabit, deleteHabit };
}

/* ============================================
   useHabitLogs
   ============================================ */
export function useHabitLogs(habitId, startDate, endDate) {
  const startStr = startDate ? format(typeof startDate === 'string' ? new Date(startDate) : startDate, 'yyyy-MM-dd') : null;
  const endStr = endDate ? format(typeof endDate === 'string' ? new Date(endDate) : endDate, 'yyyy-MM-dd') : null;

  const logs = useLiveQuery(() => {
    if (!habitId || !startStr || !endStr) return [];
    return db.habitLogs
      .where('[habitId+date]')
      .between([habitId, startStr], [habitId, endStr], true, true)
      .toArray();
  }, [habitId, startStr, endStr]) ?? [];

  const toggleLog = async (date) => {
    const dateStr = format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd');
    const existing = await db.habitLogs
      .where('[habitId+date]')
      .equals([habitId, dateStr])
      .first();

    if (existing) {
      return db.habitLogs.delete(existing.id);
    }
    return db.habitLogs.add(
      withTimestamps({
        habitId,
        date: dateStr,
        completed: true,
      })
    );
  };

  return { logs, toggleLog };
}

/* ============================================
   useAllHabitLogs
   ============================================ */
export function useAllHabitLogs(startDate, endDate) {
  const startStr = startDate ? format(typeof startDate === 'string' ? new Date(startDate) : startDate, 'yyyy-MM-dd') : null;
  const endStr = endDate ? format(typeof endDate === 'string' ? new Date(endDate) : endDate, 'yyyy-MM-dd') : null;

  const logs = useLiveQuery(() => {
    if (!startStr || !endStr) return [];
    return db.habitLogs
      .where('date')
      .between(startStr, endStr, true, true)
      .toArray();
  }, [startStr, endStr]) ?? [];

  return logs;
}

/* ============================================
   useEvents
   ============================================ */
export function useEvents() {
  const events = useLiveQuery(() => db.events.toArray()) ?? [];

  const addEvent = async (data) => {
    return db.events.add(withTimestamps(data));
  };

  const updateEvent = async (id, changes) => {
    return db.events.update(id, withUpdatedAt(changes));
  };

  const deleteEvent = async (id) => {
    return db.events.delete(id);
  };

  return { events, addEvent, updateEvent, deleteEvent };
}

/* ============================================
   useEventsByDate
   ============================================ */
export function useEventsByDate(date) {
  const dateString = date ? format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd') : null;

  const events = useLiveQuery(() => {
    if (!dateString) return [];
    return db.events.where('date').equals(dateString).toArray();
  }, [dateString]) ?? [];

  return events;
}

/* ============================================
   useEventsByDateRange
   ============================================ */
export function useEventsByDateRange(startDate, endDate) {
  const startStr = startDate ? format(typeof startDate === 'string' ? new Date(startDate) : startDate, 'yyyy-MM-dd') : null;
  const endStr = endDate ? format(typeof endDate === 'string' ? new Date(endDate) : endDate, 'yyyy-MM-dd') : null;

  const events = useLiveQuery(() => {
    if (!startStr || !endStr) return [];
    return db.events
      .where('date')
      .between(startStr, endStr, true, true)
      .toArray();
  }, [startStr, endStr]) ?? [];

  return events;
}
