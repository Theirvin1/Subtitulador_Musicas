export const getFileName = (filePath?: string): string => {
  if (!filePath) {
    return 'Sin cargar';
  }

  return filePath.split(/[\\/]/).pop() ?? filePath;
};

export const toFileUrl = (filePath?: string): string | undefined => {
  if (!filePath) {
    return undefined;
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  const prefixedPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `file://${encodeURI(prefixedPath)}`;
};
