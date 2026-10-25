#!/usr/bin/env python3
"""Extract only application bundle paths; reject links escaping the release."""
import pathlib
import sys
import tarfile

archive_path, destination = sys.argv[1:]
allowed = {"dist", "node_modules", "package.json", "pnpm-lock.yaml", "release.json"}
with tarfile.open(archive_path, "r:gz") as archive:
    members = []
    total_size = 0
    for member in archive:
        members.append(member)
        total_size += member.size
        if len(members) > 100000 or total_size > 1024 * 1024 * 1024:
            raise ValueError("Release archive exceeds extraction limits")
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] not in allowed:
            raise ValueError("Unexpected or unsafe release archive path")
        if not (member.isfile() or member.isdir() or member.issym() or member.islnk()):
            raise ValueError("Unsupported release archive member")
    # Ubuntu 24.04 Python 3.12: data_filter checks symlink/hardlink destinations,
    # strips dangerous ownership/mode metadata and disallows special files.
    archive.extractall(destination, members=members, filter="data")
