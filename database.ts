import * as SQLite from 'expo-sqlite';


const db = SQLite.openDatabaseSync('library.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      status TEXT NOT NULL,
      currentPage TEXT
    );
  `);
};

export default db;