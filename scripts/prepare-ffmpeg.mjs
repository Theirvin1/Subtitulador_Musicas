import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const targetPath = resolve('resources', 'ffmpeg', 'win', 'ffmpeg.exe');

if (!ffmpegPath || !existsSync(ffmpegPath)) {
  throw new Error('No se encontro el binario de FFmpeg provisto por ffmpeg-static.');
}

mkdirSync(dirname(targetPath), { recursive: true });

if (existsSync(targetPath) && statSync(targetPath).size === statSync(ffmpegPath).size) {
  console.log(`FFmpeg ya esta preparado en ${targetPath}`);
  process.exit(0);
}

copyFileSync(ffmpegPath, targetPath);

console.log(`FFmpeg preparado en ${targetPath}`);
