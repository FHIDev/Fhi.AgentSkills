#!/usr/bin/env python3
"""Offline validation of the public catalogs and their self-contained packages."""
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def validate(client):
    catalog = ROOT / ('.agents/plugins/marketplace.json' if client == 'codex'
                      else '.claude-plugin/marketplace.json')
    entries = json.loads(catalog.read_text())['plugins']
    expected = {'skybert-plugin': 'skybert', 'designsystem-plugin': 'designsystem'}
    assert len(entries) == len(expected), 'Unexpected plugin count'
    assert {e['name'] for e in entries} == set(expected), 'Missing or duplicate names'
    for entry in entries:
        name = entry['name']
        source = entry['source']
        if client == 'codex':
            assert source['source'] == 'local', 'Expected local source'
            source = source['path']
        assert source == './plugins/' + expected[name], f'Unexpected source: {source}'
        assert 'version' not in entry, 'Version belongs in plugin manifest'
        package = (ROOT / source).resolve()
        manifest = json.loads((package / '.claude-plugin/plugin.json').read_text())
        assert manifest['name'] == name, 'Name mismatch'
        assert re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', manifest['version']), 'Invalid version'
        assert manifest['skills'] == './skills', 'Unexpected skills path'
        skill = package / 'skills' / expected[name] / 'SKILL.md'
        assert skill.is_file(), f'Missing {skill}'
        assert re.search(r'^name: ' + expected[name] + r'\s*$', skill.read_text(), re.M)
        for path in package.rglob('*'):
            assert not path.is_symlink(), f'Symlink in package: {path}'
            assert path.name not in {'.oppdater-state.json', '.oppdater-coverage.json', 'sources'}, f'Maintenance data: {path}'
            if path.suffix != '.md':
                continue
            for target in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)', path.read_text()):
                if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:|^#', target):
                    continue
                resolved = (path.parent / target.split('#')[0]).resolve()
                assert resolved.is_relative_to(package), f'Link outside package: {path}: {target}'
                assert resolved.exists(), f'Broken link: {path}: {target}'
    print(f'{client}: catalogs, manifests, skills and package links OK')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('client', choices=['claude', 'codex'])
    validate(parser.parse_args().client)
