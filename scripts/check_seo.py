"""Validate the actual static export before deployment (Python stdlib only)."""
import json
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
import xml.etree.ElementTree as ET

ROOT = Path('out')
ORIGIN = 'https://continuousdisintegration.com'
errors = []


def check(condition, context, message):
    if not condition:
        errors.append(f'{context}: {message}')


def normalize_url(url):
    parsed = urlparse(url)
    return parsed._replace(path=parsed.path or '/').geturl()


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.meta = {}
        self.links = []
        self.anchors = []
        self.images = []
        self.headings = []
        self.schemas = []
        self.title = ''
        self.lang = ''
        self.h1 = ''
        self.capture = None
        self.script = None
        self.script_text = ''
        self.feed(path.read_text())

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'html':
            self.lang = attrs.get('lang', '')
        elif tag == 'meta':
            self.meta[attrs.get('name', attrs.get('property', ''))] = attrs.get('content', '')
        elif tag == 'link':
            self.links.append(attrs)
        elif tag == 'a':
            self.anchors.append(attrs.get('href', ''))
        elif tag == 'img':
            self.images.append(attrs)
        elif tag == 'title':
            self.capture = 'title'
        elif tag == 'h1':
            self.capture = 'h1'
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.headings.append(int(tag[1]))
        if tag == 'script':
            self.script = attrs.get('type')
            self.script_text = ''

    def handle_data(self, data):
        if self.capture:
            setattr(self, self.capture, getattr(self, self.capture) + data)
        if self.script:
            self.script_text += data

    def handle_endtag(self, tag):
        if tag in ['title', 'h1']:
            self.capture = None
        if tag == 'script':
            if self.script == 'application/ld+json':
                try:
                    self.schemas.append(json.loads(self.script_text))
                except ValueError:
                    errors.append(f'{self.path}: invalid JSON-LD')
            self.script = None

    @property
    def canonical(self):
        return [normalize_url(a.get('href', '')) for a in self.links if a.get('rel') == 'canonical']


def exported(url):
    path = unquote(urlparse(url).path)
    candidate = ROOT / path.lstrip('/')
    if candidate.is_dir() or path.endswith('/') or not candidate.suffix:
        candidate = candidate / 'index.html'
    return candidate


if not (ROOT / 'sitemap.xml').exists():
    raise SystemExit('No static export found. Run npm run build first.')
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap = ET.parse(ROOT / 'sitemap.xml').getroot()
entries = {node.findtext('s:loc', namespaces=ns): node for node in sitemap}
check(len(entries) == len(sitemap), 'sitemap', 'duplicate URLs')
pages = {}
for path in ROOT.rglob('*.html'):
    page = Page(path)
    if 'noindex' in page.meta.get('robots', '') or not page.canonical:
        continue
    canonical = page.canonical[0]
    check(canonical not in pages, path, 'duplicate canonical across indexable pages')
    pages[canonical] = page
    check(len(page.canonical) == 1, path, 'expected one canonical')
    check(exported(canonical) == path, path, 'canonical points to another page')
    check(canonical in entries, path, 'indexable page missing from sitemap')
    check(bool(page.title.strip()), path, 'missing title')
    check(bool(page.meta.get('description', '').strip()), path, 'missing description')
    check(page.headings.count(1) == 1, path, 'expected exactly one H1')
    expected_lang = 'en' if urlparse(canonical).path.startswith('/en/') else 'es'
    check(page.lang == expected_lang, path, f'html lang is {page.lang!r}, expected {expected_lang!r}')
    for image in page.images:
        check('alt' in image, path, 'image missing alt attribute')
        src = image.get('src', '')
        if src.startswith('/'):
            check(exported(src).exists(), path, f'image not exported: {src}')
    alternates = {a.get('hreflang'): normalize_url(a.get('href', '')) for a in page.links if a.get('hreflang') in ['es', 'en', 'x-default'] and a.get('type') != 'application/rss+xml'}
    check(set(alternates) == {'es', 'en', 'x-default'}, path, 'missing language alternates')
    for target in alternates.values():
        check(target in entries and exported(target).exists(), path, f'invalid alternate: {target}')
    page.alternates = alternates

inbound = defaultdict(set)
for canonical, page in pages.items():
    for href in page.anchors:
        target = urljoin(canonical, href)
        parsed = urlparse(target)
        if parsed.netloc != urlparse(ORIGIN).netloc:
            continue
        check(exported(target).exists(), page.path, f'broken internal link: {href}')
        target_path = parsed.path
        normalized = ORIGIN + target_path.rstrip('/') + '/'
        if canonical != normalized:
            inbound[normalized].add(canonical)
    for lang, target in page.alternates.items():
        if target in pages:
            check(pages[target].alternates == page.alternates, page.path, f'non-reciprocal hreflang: {lang}')

for url, entry in entries.items():
    check(url in pages, url, 'sitemap URL not indexable or missing')
    if '/posts/' not in url or url not in pages:
        continue
    page = pages[url]
    articles = [s for s in page.schemas if s.get('@type') == 'BlogPosting']
    check(len(articles) == 1, url, 'expected BlogPosting schema')
    check(len(page.title) <= 60, url, 'article title exceeds editorial budget of 60 characters')
    check(len(inbound[url]) >= 2, url, 'fewer than two distinct internal linking pages')
    if articles:
        article = articles[0]
        check(article.get('headline') == page.h1.strip(), url, 'schema headline differs from H1')
        check(article.get('url') == url, url, 'schema URL differs from canonical')
        check(article.get('dateModified') == entry.findtext('s:lastmod', namespaces=ns), url, 'sitemap date differs from article update')
        check(bool(article.get('author', {}).get('url')), url, 'missing author profile')
        for image in article.get('image', []):
            check(exported(image).exists(), url, 'schema image not exported')
    previous = 0
    for depth in page.headings:
        check(depth <= previous + 1, url, 'heading level skipped')
        previous = depth

check(ORIGIN + '/sitemap.xml' in (ROOT / 'robots.txt').read_text(), 'robots', 'missing sitemap reference')
for path in [ROOT / '404.html', ROOT / '404/index.html']:
    if path.exists():
        check('noindex' in Page(path).meta.get('robots', ''), path, '404 must not be indexed')
redirects = ROOT / '_redirects'
check(redirects.exists(), 'redirects', 'missing exported redirect rules')
if redirects.exists():
    for line in redirects.read_text().splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        source, target, status = line.split()
        check(status == '301' and source != target, source, 'invalid permanent redirect')
        if target.endswith('/'):
            check(ORIGIN + target in pages, source, 'redirect destination is not an indexable page')
        elif ':splat' in target:
            check(exported(target.split(':splat')[0]).parent.is_dir(), source, 'redirect destination folder not exported')
        else:
            check(exported(target).exists(), source, 'redirect destination file not exported')
        check(not exported(source.rstrip('*')).exists() or source.endswith('*'), source, 'redirect source still exported')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'SEO OK: {len(pages)} indexable pages, {sum("/posts/" in url for url in pages)} articles; canonicals, hreflang, H1, descriptions, internal links, images, JSON-LD and sitemap verified.')
