#!/usr/bin/env python3
"""Local CLI installation/upgrade test; isolated profiles, no account credentials.

Usage: python3 .github/scripts/test_plugin_migration.py --base <pre-migration-SHA>
Requires codex, claude, git and tar. Does not invoke a model or test Git remote refresh.
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
PLUGINS = ('skybert', 'designsystem')


def run(args, env, cwd):
    result = subprocess.run(args, cwd=cwd, env=env, text=True,
                            capture_output=True, timeout=60, check=True)
    return result.stdout


def snapshot(base, destination):
    destination.mkdir()
    archive = subprocess.check_output(['git', 'archive', base], cwd=ROOT)
    subprocess.run(['tar', '-x', '-C', str(destination)], input=archive, check=True)


def new_layout(destination):
    for name in PLUGINS:
        shutil.copytree(ROOT / 'plugins' / name, destination / 'plugins' / name)
    for manifest in ('.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json'):
        shutil.copy2(ROOT / manifest, destination / manifest)


def verify_cache(home):
    for name in PLUGINS:
        expected = ROOT / 'plugins' / name
        installed = home / 'plugins/cache/fhi-agent-skills' / (name + '-plugin') / '1.0.0'
        assert installed.is_dir(), f'Missing 1.0.0 cache: {installed}'
        expected_files = {p.relative_to(expected) for p in expected.rglob('*') if p.is_file()}
        actual_files = {p.relative_to(installed) for p in installed.rglob('*') if p.is_file()}
        assert expected_files <= actual_files, f'Incomplete installed package: {name}'
        for relative in expected_files:
            assert (expected / relative).read_bytes() == (installed / relative).read_bytes(), relative
        assert not any(p.name in {'.oppdater-state.json', '.oppdater-coverage.json', 'sources'}
                       for p in installed.rglob('*')), 'Maintenance data in cache'


def main(base):
    base = subprocess.check_output(['git', 'rev-parse', '--verify', base + '^{commit}'],
                                   cwd=ROOT, text=True).strip()
    with tempfile.TemporaryDirectory(prefix='fhi-migration-') as temporary:
        root = Path(temporary)
        for client in ('codex', 'claude'):
            for scenario in ('fresh', 'upgrade'):
                fixture = root / f'{client}-{scenario}-repo'
                home = root / f'{client}-{scenario}-home'
                home.mkdir()
                snapshot(base, fixture)
                env = {**os.environ, 'CODEX_HOME': str(home), 'CLAUDE_CONFIG_DIR': str(home)}
                if scenario == 'fresh':
                    new_layout(fixture)
                run([client, 'plugin', 'marketplace', 'add', str(fixture)], env, root)
                for name in PLUGINS:
                    action = 'add' if client == 'codex' else 'install'
                    run([client, 'plugin', action, name + '-plugin@fhi-agent-skills', '--json'], env, root)
                if scenario == 'upgrade':
                    new_layout(fixture)
                    if client == 'claude':
                        run([client, 'plugin', 'marketplace', 'update', 'fhi-agent-skills'], env, root)
                    for name in PLUGINS:
                        action = 'add' if client == 'codex' else 'update'
                        result = run([client, 'plugin', action, name + '-plugin@fhi-agent-skills', '--json'], env, root)
                        assert '1.0.0' in result, result
                verify_cache(home)
                print(f'{client} {scenario}: both 1.0.0 packages match working tree; no maintenance data')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    main(parser.parse_args().base)
