import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import initSqlJs from 'sql.js';
import type { Project, ProjectSummary } from '../../shared/types/project';
import { DATABASE_MIGRATIONS, DATABASE_SCHEMA } from './schema';
import {
  deleteProject,
  isProjectPayload,
  listProjects,
  openProject,
  saveProject
} from './projectRepository';

type Database = initSqlJs.Database;

export type AppDatabase = {
  saveProject: (project: unknown) => Project;
  listProjects: () => ProjectSummary[];
  openProject: (projectId: unknown) => Project | null;
  deleteProject: (projectId: unknown) => boolean;
};

const DATABASE_FILE_NAME = 'submusic-studio.sqlite';

const persistDatabase = (database: Database, databasePath: string): void => {
  writeFileSync(databasePath, database.export());
};

export const createDatabase = async (
  userDataPath: string,
  appPath: string
): Promise<AppDatabase> => {
  mkdirSync(userDataPath, { recursive: true });

  const databasePath = join(userDataPath, DATABASE_FILE_NAME);
  const SQL = await initSqlJs({
    locateFile: (file) => join(appPath, 'node_modules', 'sql.js', 'dist', file)
  });

  const database = existsSync(databasePath)
    ? new SQL.Database(readFileSync(databasePath))
    : new SQL.Database();

  database.exec(DATABASE_SCHEMA);
  DATABASE_MIGRATIONS.forEach((migration) => {
    try {
      database.run(migration);
    } catch {
      // Column already exists.
    }
  });
  persistDatabase(database, databasePath);

  return {
    saveProject(project) {
      if (!isProjectPayload(project)) {
        throw new Error('Invalid project payload.');
      }

      const savedProject = saveProject(database, project);
      persistDatabase(database, databasePath);
      return savedProject;
    },
    listProjects() {
      return listProjects(database);
    },
    openProject(projectId) {
      if (typeof projectId !== 'string' || !projectId) {
        throw new Error('Invalid project id.');
      }

      return openProject(database, projectId);
    },
    deleteProject(projectId) {
      if (typeof projectId !== 'string' || !projectId) {
        throw new Error('Invalid project id.');
      }

      const deleted = deleteProject(database, projectId);
      persistDatabase(database, databasePath);
      return deleted;
    }
  };
};
