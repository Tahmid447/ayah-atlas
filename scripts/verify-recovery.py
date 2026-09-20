#!/usr/bin/env python3
"""Verify an archive and its SQLite corpus without extracting untrusted paths."""
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import tarfile
import tempfile


def digest(stream):
    value = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        value.update(block)
    return value.hexdigest()


archive = Path(sys.argv[1]).resolve()
sums = archive.parent / 'SHA256SUMS.txt'
expected = next(line.split()[0] for line in sums.read_text().splitlines()
                if line.split()[-1] == archive.name)
with archive.open('rb') as stream:
    actual = digest(stream)
if actual != expected:
    raise SystemExit('Archive SHA-256 mismatch')
with tarfile.open(archive) as tar:
    manifest = json.load(tar.extractfile('ayah-atlas/data/recovery-manifest.json'))
    for name, wanted in manifest['files'].items():
        member = tar.getmember('ayah-atlas/' + name)
        if not member.isfile():
            raise SystemExit('Non-file manifest member: ' + name)
        with tar.extractfile(member) as stream:
            if digest(stream) != wanted:
                raise SystemExit('File checksum mismatch: ' + name)
    with tempfile.TemporaryDirectory(prefix='ayah-atlas-verify-') as directory:
        target = Path(directory) / 'corpus.sqlite'
        with tar.extractfile('ayah-atlas/data/corpus.sqlite') as source, target.open('wb') as output:
            for block in iter(lambda: source.read(1024 * 1024), b''):
                output.write(block)
        with sqlite3.connect(target) as db:
            integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
            ayat = db.execute('SELECT COUNT(*) FROM ayat').fetchone()[0]
            surahs = db.execute('SELECT COUNT(*) FROM surahs').fetchone()[0]
        if integrity != 'ok' or ayat != 6236 or surahs != 114:
            raise SystemExit('Restored corpus validation failed')
report = {'archive': archive.name, 'sha256': actual,
          'verifiedFiles': len(manifest['files']), 'allManifestFilesMatch': True,
          'restoredSQLiteIntegrity': integrity, 'restoredAyat': ayat,
          'restoredSurahs': surahs}
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
