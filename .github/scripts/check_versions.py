#!/usr/bin/env python3
"""Require increasing package versions when distributed files change."""
import argparse
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]


def version(value):
    if not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', value):
        raise ValueError(f'Invalid release version: {value}')
    return tuple(map(int, value.split('.')))


def check(old, new, changed):
    current = version(new)
    if old is None:
        if current != (1, 0, 0):
            raise ValueError('New plugins must start at 1.0.0')
    elif changed and current <= version(old):
        raise ValueError(f'Changed plugin requires a higher version: {old} -> {new}')


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def run(base, head):
    # Explicit SHAs avoid option injection and accidental comparisons against a moving branch.
    if not re.fullmatch(r'[0-9a-f]{40}', base):
        raise ValueError('Base must be a full commit SHA')
    if head != 'WORKTREE' and not re.fullmatch(r'[0-9a-f]{40}', head):
        raise ValueError('Head must be a full commit SHA or WORKTREE')
    for plugin in ('skybert', 'designsystem'):
        folder = f'plugins/{plugin}'
        manifest = f'{folder}/.claude-plugin/plugin.json'
        exists = bool(git('ls-tree', base, '--', manifest))
        old = json.loads(git('show', f'{base}:{manifest}'))['version'] if exists else None
        new = json.loads((ROOT / manifest).read_text() if head == 'WORKTREE'
                         else git('show', f'{head}:{manifest}'))['version']
        changed = bool(git('diff', '--name-only', base, *([] if head == 'WORKTREE' else [head]), '--', folder))
        check(old, new, changed)
        print(f'{plugin}: {old or "initial"} -> {new} OK')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', default='WORKTREE')
    args = parser.parse_args()
    run(args.base, args.head)
