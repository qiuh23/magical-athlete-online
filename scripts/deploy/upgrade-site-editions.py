#!/usr/bin/env python3
"""Reviewed, bounded ECS upgrade for the existing mainland game host.

Default --check is read-only. --apply stages trusted tools and site policy;
only the normal checked-main release may restart the game services afterwards.
"""
import argparse
import contextlib
import datetime
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile
import time

TOOLS = (
    "ci-install.mjs", "unpack-ci-artifact.py", "extract-release.py",
    "target-paths.sh", "update.sh", "backup.sh", "rollback.sh",
    "security-preflight.sh", "security-maintenance.sh", "security-ops.py",
    "disable-cn-audit.sh",
)
LIB = Path("/usr/local/lib/magical-athlete-deploy")
WRAPPER = Path("/usr/local/sbin/magical-athlete-ci-install")
ENVIRONMENTS = {
    "production": Path("/etc/magical-athlete/server.env"),
    "preview": Path("/etc/magical-athlete-preview/server.env"),
}
VHOSTS = tuple(Path("/etc/nginx/sites-available") / name for name in (
    "magical-athlete", "magical-athlete-https", "magical-athlete-lobby",
    "magical-athlete-preview",
))
# All three mainland games have stopped audit collection. These are exact old
# task/config names, never a glob over their stored records.
OLD_AUDIT_TASKS = tuple(Path(name) for name in (
    "/etc/cron.d/magical-athlete-security", "/etc/cron.d/wizard-friends-security",
    "/etc/cron.d/game-network-rotation", "/etc/logrotate.d/game-network",
))
MANAGED_KEYS = (
    "NODE_ENV", "SITE_EDITION", "BACKEND_ID", "PUBLIC_ORIGIN",
    "PUBLIC_ORIGINS", "BACKENDS_CONFIG_JSON",
)


def assignments(text):
    """Read simple systemd EnvironmentFile assignments without executing them."""
    import shlex
    values = {}
    for line in text.splitlines():
        match = re.match(r"^([A-Z][A-Z0-9_]*)=(.*)$", line)
        if not match:
            continue
        key, raw = match.groups()
        if key in values:
            raise ValueError("Duplicate environment key: " + key)
        parts = shlex.split(raw, comments=True, posix=True)
        if len(parts) > 1:
            raise ValueError("Unsupported environment value encoding for " + key)
        values[key] = parts[0] if parts else ""
    return values


def render_environment(text, target, entries):
    current = assignments(text)
    expected_port = "3000" if target == "production" else "3001"
    expected_data = "/var/lib/magical-athlete" + ("-preview" if target == "preview" else "")
    for key, value in (("HOST", "127.0.0.1"), ("PORT", expected_port), ("DATA_DIR", expected_data)):
        if current.get(key) != value:
            raise ValueError(target + " environment differs from the fixed existing layout: " + key)
    for key in ("PUBLIC_ACCESS_ENABLED", "CONTROLLED_VALIDATION"):
        if current.get(key) not in ("true", "false"):
            raise ValueError(target + " requires an explicit unchanged gate: " + key)
    quota = current.get("MULTIPLAYER_ROOM_LIMIT", "")
    if not quota.isdigit() or not 0 <= int(quota) <= (14 if target == "production" else 1):
        raise ValueError(target + " capacity must retain the existing production/preview reservation")
    if current.get("DUAL_BACKEND_ENABLED") != "true":
        raise ValueError(target + " requires its existing bounded admission configuration")
    settings = entries[target]
    origin = settings["aliyunOrigin"]
    origins = list(dict.fromkeys([origin] + settings.get("legacyOrigins", [])))
    registry = {"siteEdition": "cn", "backends": [{"id": "aliyun", "origin": "", "transport": "socketio", "enabled": True}]}
    replacements = {
        "NODE_ENV": "production", "SITE_EDITION": "cn", "BACKEND_ID": "aliyun",
        "PUBLIC_ORIGIN": origin, "PUBLIC_ORIGINS": ",".join(origins),
        "BACKENDS_CONFIG_JSON": "'" + json.dumps(registry, separators=(",", ":")) + "'",
    }
    # Keep every unrelated line, secret, launch gate, quota and storage setting.
    remaining = [line for line in text.splitlines() if not any(line.startswith(key + "=") for key in MANAGED_KEYS)]
    return "\n".join(remaining + [key + "=" + replacements[key] for key in MANAGED_KEYS]) + "\n"


def render_vhost(text):
    # These four application-owned files may contain multiple server blocks.
    # Removing per-location logs makes every location inherit the explicit off.
    clean = re.sub(r"(?m)^[ \t]*access_log\s+[^;]+;[ \t]*(?:#[^\n]*)?\n?", "", text)
    clean, count = re.subn(r"(?m)^([ \t]*)server[ \t]*\{[ \t]*\n", r"\1server {\n\1    access_log off;\n", clean)
    if count == 0:
        raise ValueError("Unsupported vhost layout: expected explicit server blocks")
    return clean.replace("error_log /dev/null emerg;", "error_log /var/log/nginx/error.log warn;")


def regular(path, required=True):
    if path.is_symlink():
        raise ValueError("Refusing an unexpected symlink: " + str(path))
    if not path.exists():
        if required:
            raise ValueError("Required existing host file is missing: " + str(path))
        return False
    if not path.is_file():
        raise ValueError("Expected a regular file: " + str(path))
    if hasattr(os, "geteuid") and os.geteuid() == 0 and path.stat().st_uid != 0:
        raise ValueError("Expected an existing root-owned host file: " + str(path))
    return True


def plan(source):
    entries = json.loads((source / "deploy/entries.json").read_text())
    expected = {
        "production": "https://athlete.magical-athlete-online.cn",
        "preview": "http://115.29.188.62:8080",
    }
    if any(entries[target]["aliyunOrigin"] != origin for target, origin in expected.items()):
        raise ValueError("Reviewed site origins differ from the existing host")
    # Do not silently install new delegated permissions or operating-system users.
    regular(Path("/etc/sudoers.d/magical-athlete-deploy"))
    changes = []
    for target, destination in ENVIRONMENTS.items():
        regular(destination)
        data = render_environment(destination.read_text(), target, entries).encode()
        changes.append((destination, data, None))
    for name in TOOLS:
        original = source / "scripts/deploy" / name
        regular(original)
        regular(LIB / name, required=False)
        changes.append((LIB / name, original.read_bytes(), 0o644))
    wrapper = source / "scripts/deploy/ci-install.sh"
    regular(wrapper)
    regular(WRAPPER)
    changes.append((WRAPPER, wrapper.read_bytes(), 0o755))
    for destination in VHOSTS:
        regular(destination)
        changes.append((destination, render_vhost(destination.read_text()).encode(), None))
    for destination in OLD_AUDIT_TASKS:
        if regular(destination, required=False):
            changes.append((destination, None, None))
    return [(path, data, mode) for path, data, mode in changes if not path.exists() or data is None or path.read_bytes() != data or mode is not None and stat.S_IMODE(path.stat().st_mode) != mode]


def write_atomic(path, data, mode, uid=0, gid=0):
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix=".site-edition-upgrade-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(name, mode)
        os.chown(name, uid, gid)
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


@contextlib.contextmanager
def host_locks():
    import fcntl
    with contextlib.ExitStack() as stack:
        for name in ("magical-athlete-production.deploy.lock", "magical-athlete-preview.deploy.lock", "game-sites.configure.lock"):
            handle = stack.enter_context(open("/run/lock/" + name, "a"))
            deadline = time.monotonic() + 15
            while True:
                try:
                    fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except BlockingIOError:
                    if time.monotonic() >= deadline:
                        raise RuntimeError("An existing deployment owns the host lock; retry after it finishes")
                    time.sleep(0.2)
        yield


def apply(changes, commit):
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = Path("/var/backups/magical-athlete/site-edition-upgrade") / (stamp + "-" + commit[:12])
    backup.mkdir(parents=True, mode=0o700, exist_ok=False)
    before = []
    try:
        for path, data, mode in changes:
            if path.exists():
                previous = path.stat()
                content = path.read_bytes()
                saved = backup / str(path).lstrip("/")
                saved.parent.mkdir(parents=True, mode=0o700, exist_ok=True)
                saved.write_bytes(content)
                saved.chmod(0o600)
                before.append((path, content, stat.S_IMODE(previous.st_mode), previous.st_uid, previous.st_gid))
                file_mode = mode if mode is not None else stat.S_IMODE(previous.st_mode)
                uid, gid = (0, 0) if mode is not None else (previous.st_uid, previous.st_gid)
            else:
                before.append((path, None, 0o644, 0, 0))
                file_mode, uid, gid = mode or 0o644, 0, 0
            if data is None:
                path.unlink()
            else:
                write_atomic(path, data, file_mode, uid, gid)
        subprocess.run(["/usr/sbin/nginx", "-t"], check=True)
        if any(path in VHOSTS for path, _, _ in changes):
            subprocess.run(["/usr/bin/systemctl", "reload", "nginx"], check=True)
    except BaseException:
        for path, data, mode, uid, gid in reversed(before):
            if data is None:
                path.unlink(missing_ok=True)
            else:
                write_atomic(path, data, mode, uid, gid)
        raise
    (backup / "upgrade.json").write_text(json.dumps({"reviewedCommit": commit, "paths": [str(path) for path, _, _ in changes]}, indent=2) + "\n")
    print("Configuration/tools staged; private rollback copy: " + str(backup))
    print("Game services were not restarted. Continue through the checked-main release.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Apply the reviewed host-only upgrade (default is read-only check)")
    parser.add_argument("--commit", required=True, help="Exact reviewed main commit from the operator's verified source archive")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-f0-9]{40}", args.commit):
        raise ValueError("Require a complete reviewed main commit")
    if os.geteuid() != 0:
        raise ValueError("Run the host check/apply as root from the reviewed source archive")
    source = Path(__file__).resolve().parents[2]
    with host_locks() if args.apply else contextlib.nullcontext():
        changes = plan(source)
        print("Planned changed paths: " + str(len(changes)))
        for path, data, _ in changes:
            print(("disable " if data is None else "update ") + str(path))
        if args.apply and changes:
            apply(changes, args.commit)
        elif args.apply:
            print("Already current; no file, process or data changed.")
        else:
            print("Read-only check; environment values and secrets were not printed.")


if __name__ == "__main__":
    main()
