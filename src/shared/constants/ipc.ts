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
  fonts: {
    list: 'fonts:list',
    add: 'fonts:add'
  },
  media: {
    selectFile: 'media:select-file'
  },
  export: {
    checkFfmpeg: 'export:check-ffmpeg',
    selectOutputDirectory: 'export:select-output-directory',
    extractCoverFrame: 'export:extract-cover-frame',
    validate: 'export:validate',
    mp4: 'export:mp4'
  }
} as const;
