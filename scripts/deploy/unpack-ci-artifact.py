#!/usr/bin/env python3
"""Accept exactly the two expected ZIP members and verify their release identity."""
import base64
import hashlib
import json
import pathlib
import re
import shutil
import sys
import tarfile
import zipfile

zip_path, output_directory, encoded_request = sys.argv[1:]
request = json.loads(base64.b64decode(encoded_request))
destination = pathlib.Path(output_directory)
names = {"aliyun.tar.gz", "aliyun.tar.gz.sha256"}
with zipfile.ZipFile(zip_path) as archive:
    entries = archive.infolist()
    if len(entries) != 2 or {item.filename for item in entries} != names:
        raise ValueError("Artifact ZIP must contain exactly the expected release and SHA256 files")
    if sum(item.file_size for item in entries) > 512 * 1024 * 1024:
        raise ValueError("Unpacked artifact exceeds the deployment size limit")
    if archive.getinfo("aliyun.tar.gz.sha256").file_size > 4096:
        raise ValueError("Bundle SHA256 sidecar is oversized")
    for entry in entries:
        with archive.open(entry) as source, (destination / entry.filename).open("wb") as target:
            shutil.copyfileobj(source, target)

sidecar = (destination / "aliyun.tar.gz.sha256").read_text(encoding="utf-8")
match = re.fullmatch(r"([a-f0-9]{64}) [ *]aliyun\.tar\.gz\n?", sidecar)
if not match:
    raise ValueError("Invalid bundle SHA256 sidecar")
with (destination / "aliyun.tar.gz").open("rb") as source:
    digest = hashlib.file_digest(source, "sha256").hexdigest()
if digest != match.group(1):
    raise ValueError("Bundle SHA256 mismatch")
with tarfile.open(destination / "aliyun.tar.gz", "r:gz") as archive:
    item = archive.getmember("dist/client/deployment.json")
    if not item.isfile() or item.size > 65536:
        raise ValueError("Missing or oversized deployment metadata")
    metadata = json.load(archive.extractfile(item))
    for key in ("target", "commit", "runId"):
        if metadata.get(key) != request[key]:
            raise ValueError("Deployment metadata does not match the requested artifact")
    if request["target"] == "preview" and metadata.get("prNumber") != request["prNumber"]:
        raise ValueError("Preview PR metadata does not match the requested artifact")
