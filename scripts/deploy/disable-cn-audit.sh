#!/usr/bin/env bash
# Stop new mainland audit collection, retaining old private records and gameplay backups.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root from the reviewed installed library.' >&2; exit 1; }
[[ ${SITE_EDITION:-cn} == cn ]] || { echo 'This host migration is only for the mainland Node service.' >&2; exit 1; }
# Exact legacy audit jobs for the three mainland games; no stored data is removed.
rm -f -- /etc/cron.d/magical-athlete-security /etc/cron.d/game-network-rotation
python3 - <<'PY'
from pathlib import Path
import re
base=Path('/etc/nginx/sites-available')
for name in ['magical-athlete','magical-athlete-preview','magical-athlete-https','magical-athlete-lobby']:
    path=base/name
    if not path.exists(): continue
    if path.is_symlink() or not path.is_file(): raise SystemExit('Unexpected mainland vhost path; inspect before migrating.')
    text=path.read_text()
    if 'access_log ' in text:
        text=re.sub(r'(?m)^(\s*)access_log\s+[^;]+;',r'\1access_log off;',text)
    else:
        text=re.sub(r'(?m)^(\s*)server\s*\{',r'\1server {\n    access_log off;',text)
    text=text.replace('error_log /dev/null emerg;','error_log /var/log/nginx/error.log warn;')
    path.write_text(text)
PY
if command -v nginx >/dev/null; then nginx -t; systemctl reload nginx; fi
echo 'Domestic vhost access logs and application audit cron disabled. Existing databases, logs and fault reporting retained.'
