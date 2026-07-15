#!/bin/bash

# === CONFIG ===
SOURCE_DIR="./files"   # Carpeta donde tienes los 13 archivos
TARGET_DIR="./src"

# === FUNCIONES ===
copy_file() {
    local src="$1"
    local dest="$2"

    mkdir -p "$(dirname "$dest")"

    if [ -f "$dest" ]; then
        echo "🗑️ Eliminando duplicado: $dest"
        rm "$dest"
    fi

    echo "📦 Copiando: $src → $dest"
    cp "$src" "$dest"
}

# === COPIAS ===

# lib/
copy_file "$SOURCE_DIR/stickers.ts"        "$TARGET_DIR/lib/stickers.ts"
copy_file "$SOURCE_DIR/boomerang.ts"       "$TARGET_DIR/lib/boomerang.ts"
copy_file "$SOURCE_DIR/videoTrim.ts"       "$TARGET_DIR/lib/videoTrim.ts"

# components/stories/
copy_file "$SOURCE_DIR/NuevaHistoria.tsx"      "$TARGET_DIR/components/stories/NuevaHistoria.tsx"
copy_file "$SOURCE_DIR/StoryViewer.tsx"        "$TARGET_DIR/components/stories/StoryViewer.tsx"
copy_file "$SOURCE_DIR/StoriesBar.tsx"         "$TARGET_DIR/components/stories/StoriesBar.tsx"
copy_file "$SOURCE_DIR/StickerLayer.tsx"       "$TARGET_DIR/components/stories/StickerLayer.tsx"
copy_file "$SOURCE_DIR/StickerToolbar.tsx"     "$TARGET_DIR/components/stories/StickerToolbar.tsx"
copy_file "$SOURCE_DIR/CameraCapture.tsx"      "$TARGET_DIR/components/stories/CameraCapture.tsx"
copy_file "$SOURCE_DIR/LocationSearch.tsx"     "$TARGET_DIR/components/stories/LocationSearch.tsx"
copy_file "$SOURCE_DIR/VideoTrimEditor.tsx"    "$TARGET_DIR/components/stories/VideoTrimEditor.tsx"

# app/(main)/feed/
copy_file "$SOURCE_DIR/feed_page.tsx"          "$TARGET_DIR/app/(main)/feed/page.tsx"

# app/(main)/notificaciones/
copy_file "$SOURCE_DIR/notificaciones_page.tsx" "$TARGET_DIR/app/(main)/notificaciones/page.tsx"

echo ""
echo "✅ Todo copiado correctamente desde 'files/' y duplicados eliminados."
