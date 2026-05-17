export const IPC_CHANNELS = {
  projects: {
    save: 'projects:save',
    list: 'projects:list',
    open: 'projects:open',
    delete: 'projects:delete'
  },
  settings: {
    get: 'settings:get',
    update: 'settings:update'
  },
  media: {
    selectFile: 'media:select-file'
  },
  export: {
    checkFfmpeg: 'export:check-ffmpeg',
    selectOutputDirectory: 'export:select-output-directory',
    mp4: 'export:mp4'
  }
} as const;
