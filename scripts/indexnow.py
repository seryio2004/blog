"""Notify IndexNow (Bing, Yandex, Seznam, Naver...) about URLs changed by a deploy.

Compares the freshly built out/sitemap.xml with the sitemap that was live before
the deploy and submits new, updated (different lastmod) and removed URLs.
Python stdlib only. Never fails the deploy: problems are reported as warnings.

  python3 scripts/indexnow.py --previous previous-sitemap.xml   # after deploying
  python3 scripts/indexnow.py --all                             # resubmit every URL
  python3 scripts/indexnow.py --url https://...                 # specific URLs
  add --dry-run to print the list without sending anything
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ORIGIN = 'https://continuousdisintegration.com'
HOST = 'continuousdisintegration.com'
KEY = '3c3bca2612a36660ac74adfde910bedb'
KEY_LOCATION = f'{ORIGIN}/{KEY}.txt'
ENDPOINT = 'https://api.indexnow.org/indexnow'
SITEMAP = Path('out/sitemap.xml')
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
# Cloudflare rejects Python's default User-Agent (403), so identify the client explicitly.
USER_AGENT = 'continuousdisintegration-indexnow/1.0'


def warn(message):
    # GitHub Actions shows ::warning:: lines as annotations on the run.
    print(f'::warning::IndexNow: {message}')


def read_sitemap(text):
    root = ET.fromstring(text)
    return {node.findtext('s:loc', namespaces=NS): node.findtext('s:lastmod', default='', namespaces=NS) for node in root}


def changed_urls(previous, current):
    added = [url for url in current if url not in previous]
    updated = [url for url in current if url in previous and current[url] != previous[url]]
    removed = [url for url in previous if url not in current]
    return added, updated, removed


def key_is_live(attempts=6, delay=10):
    # The key file must be reachable before submitting, and a deploy can take a moment to propagate.
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(urllib.request.Request(KEY_LOCATION, headers={'User-Agent': USER_AGENT}), timeout=15) as response:
                if response.read().decode().strip() == KEY:
                    return True
        except (urllib.error.URLError, TimeoutError):
            pass
        if attempt < attempts - 1:
            time.sleep(delay)
    return False


def submit(urls):
    body = json.dumps({'host': HOST, 'key': KEY, 'keyLocation': KEY_LOCATION, 'urlList': urls}).encode()
    request = urllib.request.Request(ENDPOINT, data=body, method='POST', headers={'Content-Type': 'application/json; charset=utf-8', 'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, ''
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode(errors='replace')[:300]
    except (urllib.error.URLError, TimeoutError) as error:
        return None, str(error)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--previous', type=Path, help='sitemap.xml that was live before the deploy')
    group.add_argument('--all', action='store_true', help='submit every URL in out/sitemap.xml')
    group.add_argument('--url', action='append', help='submit this URL (repeatable)')
    parser.add_argument('--dry-run', action='store_true', help='print the URLs without submitting')
    args = parser.parse_args()

    if args.url:
        urls = args.url
    else:
        if not SITEMAP.exists():
            warn('out/sitemap.xml not found; run npm run build first.')
            return
        current = read_sitemap(SITEMAP.read_text())
        if args.all:
            urls = list(current)
        else:
            try:
                previous = read_sitemap(args.previous.read_text())
            except (OSError, ET.ParseError) as error:
                warn(f'could not read the previous sitemap ({error}); nothing submitted. Use --all to resubmit everything.')
                return
            added, updated, removed = changed_urls(previous, current)
            for label, group_urls in [('new', added), ('updated', updated), ('removed', removed)]:
                for url in group_urls:
                    print(f'  {label:8} {url}')
            urls = added + updated + removed

    urls = [url for url in dict.fromkeys(urls) if url.startswith(ORIGIN + '/')]
    if not urls:
        print('IndexNow: no changed URLs, nothing to submit.')
        return
    print(f'IndexNow: {len(urls)} URL(s) to submit.')
    if args.dry_run:
        print('\n'.join(urls))
        return
    if not key_is_live():
        warn(f'key file not reachable at {KEY_LOCATION}; nothing submitted.')
        return
    status, detail = submit(urls[:10000])
    if status in (200, 202):
        print(f'IndexNow: accepted ({status}).')
    else:
        warn(f'submission failed (HTTP {status}). {detail}')


if __name__ == '__main__':
    main()
    sys.exit(0)
