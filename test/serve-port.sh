#!/bin/sh
# Serve index.html + add.html on :8779 with RELAYS swapped to the lab relay (ws://127.0.0.1:7777).
# Copies only — the repo files keep the public relay list. Used by the 8828 smoke/agree tests.
set -e
D="${TMPDIR:-/tmp}/wtc-port"; mkdir -p "$D"; cd "$(dirname "$0")/.."
for f in index.html add.html; do
  python3 - "$f" "$D/$f" <<'PY'
import sys,re
s=open(sys.argv[1]).read()
s=s.replace("connect-src wss:;","connect-src ws://127.0.0.1:7777 wss:;")
s=re.sub(r'const RELAYS = \[\n(?:  "wss://[^\n]*\n)+\];','const RELAYS = [\n  "ws://127.0.0.1:7777"\n];',s,count=1)
open(sys.argv[2],'w').write(s)
PY
done
cp nip46.js "$D/"
cd "$D" && exec python3 -m http.server 8779
