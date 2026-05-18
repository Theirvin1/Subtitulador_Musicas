Coloca aqui `ffmpeg.exe` para incluir FFmpeg dentro del instalador de Windows.

Ruta esperada en desarrollo:

`resources/ffmpeg/win/ffmpeg.exe`

En la app empaquetada, electron-builder copiara esta carpeta como recurso externo:

`resources/ffmpeg/win/ffmpeg.exe`

El binario no se guarda en SQLite ni dentro del ASAR.
