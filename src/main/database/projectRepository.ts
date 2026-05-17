import type initSqlJs from 'sql.js';
import { createDefaultSubtitleStyle } from '../../shared/constants/subtitleStyle';
import type { Project, ProjectSummary, SubtitleStyle, VideoFormat } from '../../shared/types/project';

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

const isSubtitleStylePayload = (value: unknown): value is SubtitleStyle => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const style = value as SubtitleStyle;
  return (
    isString(style.fontOriginal) &&
    isString(style.fontTranslation) &&
    isString(style.colorOriginal) &&
    isString(style.colorTranslation) &&
    Number.isFinite(style.sizeOriginal) &&
    Number.isFinite(style.sizeTranslation) &&
    Number.isFinite(style.borderSize) &&
    typeof style.shadow === 'boolean' &&
    Number.isFinite(style.xOriginal) &&
    Number.isFinite(style.yOriginal) &&
    Number.isFinite(style.xTranslation) &&
    Number.isFinite(style.yTranslation) &&
    typeof style.moveTogether === 'boolean'
  );
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
    isSubtitleStylePayload(project.subtitleStyle) &&
    isString(project.createdAt) &&
    isString(project.updatedAt)
  );
};

const mapSubtitleStyleRow = (
  row: Record<string, SqlValue>,
  width: number,
  height: number
): SubtitleStyle => {
  const defaultStyle = createDefaultSubtitleStyle(width, height);

  return {
    fontOriginal: isString(row.font_family) ? row.font_family : defaultStyle.fontOriginal,
    fontTranslation: isString(row.font_translation)
      ? row.font_translation
      : defaultStyle.fontTranslation,
    sizeOriginal: Number(row.font_size ?? defaultStyle.sizeOriginal),
    sizeTranslation: Number(row.size_translation ?? defaultStyle.sizeTranslation),
    colorOriginal: isString(row.primary_color) ? row.primary_color : defaultStyle.colorOriginal,
    colorTranslation: isString(row.secondary_color)
      ? row.secondary_color
      : defaultStyle.colorTranslation,
    borderSize: Number(row.border_size ?? defaultStyle.borderSize),
    shadow: row.shadow === undefined ? defaultStyle.shadow : row.shadow === 1 || row.shadow === '1',
    xOriginal: Number(row.x_original ?? defaultStyle.xOriginal),
    yOriginal: Number(row.y_original ?? defaultStyle.yOriginal),
    xTranslation: Number(row.x_translation ?? defaultStyle.xTranslation),
    yTranslation: Number(row.y_translation ?? defaultStyle.yTranslation),
    moveTogether:
      row.move_together === undefined
        ? defaultStyle.moveTogether
        : row.move_together === 1 || row.move_together === '1'
  };
};

const mapProjectRow = (row: Record<string, SqlValue>): Project => {
  const width = Number(row.width);
  const height = Number(row.height);

  return {
    id: String(row.id),
    name: String(row.name),
    audioPath: nullableString(row.audio_path),
    videoPath: nullableString(row.video_path),
    backgroundPath: nullableString(row.background_path),
    coverPath: nullableString(row.cover_path),
    exportBasePath: nullableString(row.export_base_path),
    videoFormat: String(row.video_format) as VideoFormat,
    width,
    height,
    fps: Number(row.fps),
    subtitleStyle: mapSubtitleStyleRow(row, width, height),
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

  database.run(
    `
    INSERT INTO subtitle_styles (
      id,
      project_id,
      font_family,
      font_size,
      primary_color,
      secondary_color,
      background_color,
      created_at,
      updated_at,
      font_translation,
      size_translation,
      border_size,
      shadow,
      x_original,
      y_original,
      x_translation,
      y_translation,
      move_together
    )
    VALUES (
      $id,
      $projectId,
      $fontOriginal,
      $sizeOriginal,
      $colorOriginal,
      $colorTranslation,
      $backgroundColor,
      $createdAt,
      $updatedAt,
      $fontTranslation,
      $sizeTranslation,
      $borderSize,
      $shadow,
      $xOriginal,
      $yOriginal,
      $xTranslation,
      $yTranslation,
      $moveTogether
    )
    ON CONFLICT(project_id) DO UPDATE SET
      font_family = excluded.font_family,
      font_size = excluded.font_size,
      primary_color = excluded.primary_color,
      secondary_color = excluded.secondary_color,
      updated_at = excluded.updated_at,
      font_translation = excluded.font_translation,
      size_translation = excluded.size_translation,
      border_size = excluded.border_size,
      shadow = excluded.shadow,
      x_original = excluded.x_original,
      y_original = excluded.y_original,
      x_translation = excluded.x_translation,
      y_translation = excluded.y_translation,
      move_together = excluded.move_together
    `,
    {
      $id: `${updatedProject.id}:default`,
      $projectId: updatedProject.id,
      $fontOriginal: updatedProject.subtitleStyle.fontOriginal,
      $sizeOriginal: updatedProject.subtitleStyle.sizeOriginal,
      $colorOriginal: updatedProject.subtitleStyle.colorOriginal,
      $colorTranslation: updatedProject.subtitleStyle.colorTranslation,
      $backgroundColor: 'rgba(5, 9, 14, 0.68)',
      $createdAt: updatedProject.createdAt,
      $updatedAt: updatedProject.updatedAt,
      $fontTranslation: updatedProject.subtitleStyle.fontTranslation,
      $sizeTranslation: updatedProject.subtitleStyle.sizeTranslation,
      $borderSize: updatedProject.subtitleStyle.borderSize,
      $shadow: updatedProject.subtitleStyle.shadow ? 1 : 0,
      $xOriginal: updatedProject.subtitleStyle.xOriginal,
      $yOriginal: updatedProject.subtitleStyle.yOriginal,
      $xTranslation: updatedProject.subtitleStyle.xTranslation,
      $yTranslation: updatedProject.subtitleStyle.yTranslation,
      $moveTogether: updatedProject.subtitleStyle.moveTogether ? 1 : 0
    }
  );

  return updatedProject;
};

export const listProjects = (database: Database): ProjectSummary[] => {
  return readRows(
    database,
    `
    SELECT
      projects.id AS id,
      projects.name AS name,
      projects.audio_path AS audio_path,
      projects.video_path AS video_path,
      projects.background_path AS background_path,
      projects.cover_path AS cover_path,
      projects.export_base_path AS export_base_path,
      projects.video_format AS video_format,
      projects.width AS width,
      projects.height AS height,
      projects.fps AS fps,
      subtitle_styles.font_family,
      subtitle_styles.font_size,
      subtitle_styles.primary_color,
      subtitle_styles.secondary_color,
      subtitle_styles.font_translation,
      subtitle_styles.size_translation,
      subtitle_styles.border_size,
      subtitle_styles.shadow,
      subtitle_styles.x_original,
      subtitle_styles.y_original,
      subtitle_styles.x_translation,
      subtitle_styles.y_translation,
      subtitle_styles.move_together,
      projects.created_at AS created_at,
      projects.updated_at AS updated_at
    FROM projects
    LEFT JOIN subtitle_styles ON subtitle_styles.project_id = projects.id
    ORDER BY projects.updated_at DESC
    `
  );
};

export const openProject = (database: Database, projectId: string): Project | null => {
  return (
    readRows(
      database,
      `
      SELECT
        projects.id AS id,
        projects.name AS name,
        projects.audio_path AS audio_path,
        projects.video_path AS video_path,
        projects.background_path AS background_path,
        projects.cover_path AS cover_path,
        projects.export_base_path AS export_base_path,
        projects.video_format AS video_format,
        projects.width AS width,
        projects.height AS height,
        projects.fps AS fps,
        subtitle_styles.font_family,
        subtitle_styles.font_size,
        subtitle_styles.primary_color,
        subtitle_styles.secondary_color,
        subtitle_styles.font_translation,
        subtitle_styles.size_translation,
        subtitle_styles.border_size,
        subtitle_styles.shadow,
        subtitle_styles.x_original,
        subtitle_styles.y_original,
        subtitle_styles.x_translation,
        subtitle_styles.y_translation,
        subtitle_styles.move_together,
        projects.created_at AS created_at,
        projects.updated_at AS updated_at
      FROM projects
      LEFT JOIN subtitle_styles ON subtitle_styles.project_id = projects.id
      WHERE projects.id = $id
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
