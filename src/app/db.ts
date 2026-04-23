import Dexie, {Table} from 'dexie';

export interface Entry {
  id?: number;
  timestamp: Date;
  name?: string;
  calories: number;
  protein?: number;
  fiber?: number;
  fat?: number;
  carbs?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id?: number;
  name: string;
  displayName: string;
  calories: number;
  protein?: number;
  fiber?: number;
  fat?: number;
  carbs?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalHistory {
  id?: number;
  effectiveFrom: Date;
  dailyGoal: number;
}

export interface SettingsRow {
  key: string;
  weekStartsOn: 'monday';
  badgeEnabled: boolean;
  notificationEnabled: boolean;
}

export class CalorieDB extends Dexie {
  entries!: Table<Entry, number>;
  templates!: Table<Template, number>;
  goalHistory!: Table<GoalHistory, number>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super('calorie-db');
    this.version(1).stores({
      entries: '++id, timestamp, name',
      templates: '++id, &name',
      goalHistory: '++id, effectiveFrom',
      settings: 'key',
    });
  }
}

export const db = new CalorieDB();
