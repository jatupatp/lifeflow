import Dexie from 'dexie';

export const db = new Dexie('LifeFlowDB');

// Version 2 upgrades the schema and prevents crashes for existing users.
db.version(2).stores({
  categories: '++id, name',
  goals: '++id, title, categoryId, status, createdAt',
  milestones: '++id, goalId, title, order, completed, dueDate',
  tasks: '++id, title, dueDate, priority, status, goalId, createdAt',
  habits: '++id, title, frequency, createdAt',
  habitLogs: '++id, habitId, date, [habitId+date]',
  events: '++id, title, date, startTime, endTime, goalId',
});

// Automatic recovery on version upgrade/schema error: deletes the DB and reloads the page.
db.open().catch(async (err) => {
  if (err.name === 'VersionError' || err.name === 'UpgradeError' || err.name === 'SchemaError') {
    console.warn("Database schema mismatch, deleting and recreating database...", err);
    try {
      await db.delete();
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to delete database:", e);
    }
  } else {
    console.error("Dexie failed to open:", err);
  }
});

export default db;
