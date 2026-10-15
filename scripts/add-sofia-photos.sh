#!/bin/sh
# Crops the four Sofia photos into square faces for the Match Up "Sofia" category.
# Run from the project folder:  sh scripts/add-sofia-photos.sh
# Photos are read from ~/Downloads (Unknown.jpg, Unknown-2.jpg, Unknown-3.jpg, Unknown-4.jpg).
# Each crop goes through PNG and back, which drops the camera data (GPS location, time, phone model).
set -e
SRC="$HOME/Downloads"
OUT="img/sofia"
mkdir -p "$OUT"
crop() {  # source file, output name, square size, y offset, x offset
  sips -c "$3" "$3" --cropOffset "$4" "$5" "$SRC/$1" --out /tmp/sofia-crop.jpg >/dev/null
  sips -z 320 320 -s format png /tmp/sofia-crop.jpg --out /tmp/sofia-crop.png >/dev/null
  sips -s format jpeg -s formatOptions 82 /tmp/sofia-crop.png --out "$OUT/$2.jpg" >/dev/null
}
crop Unknown.jpg   sofia-1 1000 280 200
crop Unknown-2.jpg sofia-2 1000 300 300
crop Unknown-3.jpg sofia-3 1000 280 280
crop Unknown-4.jpg sofia-4 1100 400 200
rm -f /tmp/sofia-crop.jpg /tmp/sofia-crop.png
ls -la "$OUT"
