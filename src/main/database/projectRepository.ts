import type initSqlJs from 'sql.js';
import type { Project, ProjectSummary, VideoFormat } from '../../shared/types/project';

type Database = initSqlJs.Database;
type SqlValue = initSqlJs.SqlValue;

const VIDEO_FORMATS: VideoFormat[] = [
  'VERTICAL_9_16',
  'HORIZONTAL_16_9',
  'SQUARE_1_1',
  'CLASSIC_4_3',
  'VERTICAL_3_4',
  'ORIGINAL'
];

const isString = (value: unknown): value is string => typeof value === 'string';

const isVideoFormat = (value: unknown): value is VideoFormat => {
  return isString(value) && VIDEO_FORMATS.includes(value as VideoFormat);
};

const nullableString = (value: unknown): string | undefined => {
  return isString(value) && value.length > 0 ? value : undefined;
};

export const isProjectPayload = (value: unknown): value is Project => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const project = value as Project;
  return (
    isString(project.id) &&
    isString(project.name) &&
    isVideoFormat(project.videoFormat) &&
    Number.isFinite(project.width) &&
    Number.isFinite(project.height) &&
    Number.isFinite(project.fps) &&
    isString(project.createdAt) &&
    isString(project.updatedAt)
  );
};

const mapProjectRow = (row: Record<string, SqlValue>): Project => {
  return {
    id: String(row.id),
    name: String(row.name),
    audioPath: nullableString(row.audio_path),
    videoPath: nullableString(row.video_path),
    backgroundPath: nullableString(row.background_path),
    coverPath: nullableString(row.cover_path),
    exportBasePath: nullableString(row.export_base_path),
    videoFormat: String(row.video_format) as VideoFormat,
    width: Number(row.width),
    height: Number(row.height),
    fps: Number(row.fps),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
};

const readRows = (database: Database, sql: string, params: Record<string, SqlValue> = {}): Project[] => {
  const statement = database.prepare(sql, params);
  const rows: Project[] = [];

  try {
    while (statement.step()) {
      rows.push(mapProjectRow(statement.getAsObject()));
    }
  } finally {
    statement.free();
  }

  return rows;
};

export const saveProject = (database: Database, project: Project): Project => {
  const updatedProject: Project = {
    ...project,
    name: project.name.trim(),
    updatedAt: new Date().toISOString()
  };

  database.run(
    `
    INSERT INTO projects (
      id,
      name,
      audio_path,
      video_path,
      background_path,
      cover_path,
      export_base_path,
      video_format,
      width,
      height,
      fps,
      created_at,
      updated_at
    )
    VALUES (
      $id,
      $name,
      $audioPath,
      $videoPath,
      $backgroundPath,
      $coverPath,
      $exportBasePath,
      $videoFormat,
      $width,
      $height,
      $fps,
      $createdAt,
      $updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      audio_path = excluded.audio_path,
      video_path = excluded.video_path,
      background_path = excluded.background_path,
      cover_path = excluded.cover_path,
      export_base_path = excluded.export_base_path,
      video_format = excluded.video_format,
      width = excluded.width,
      height = excluded.height,
      fps = excluded.fps,
      updated_at = excluded.updated_at
    `,
    {
      $id: updatedProject.id,
      $name: updatedProject.name,
      $audioPath: updatedProject.audioPath ?? null,
      $videoPath: updatedProject.videoPath ?? null,
      $backgroundPath: updatedProject.backgroundPath ?? null,
      $coverPath: updatedProject.coverPath ?? null,
      $exportBasePath: updatedProject.exportBasePath ?? null,
      $videoFormat: updatedProject.videoFormat,
      $width: updatedProject.width,
      $height: updatedProject.height,
      $fps: updatedProject.fps,
      $createdAt: updatedProject.createdAt,
      $updatedAt: updatedProject.updatedAt
    }
  );

  return updatedProject;
};

export const listProjects = (database: Database): ProjectSummary[] => {
  return readRows(
    database,
    `
    SELECT
      id,
      name,
      audio_path,
      video_path,
      background_path,
      cover_path,
      export_base_path,
      video_format,
      width,
      height,
      fps,
      created_at,
      updated_at
    FROM projects
    ORDER BY updated_at DESC
    `
  );
};

export const openProject = (database: Database, projectId: string): Project | null => {
  return (
    readRows(
      database,
      `
      SELECT
        id,
        name,
        audio_path,
        video_path,
        background_path,
        cover_path,
        export_base_path,
        video_format,
        width,
        height,
        fps,
        created_at,
        updated_at
      FROM projects
      WHERE id = $id
      LIMIT 1
      `,
      { $id: projectId }
    )[0] ?? null
  );
};

export const deleteProject = (database: Database, projectId: string): boolean => {
  database.run('DELETE FROM projects WHERE id = $id', { $id: projectId });
  return database.getRowsModified() > 0;
};
