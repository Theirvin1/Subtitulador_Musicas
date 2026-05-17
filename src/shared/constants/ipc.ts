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
  }
} as const;
