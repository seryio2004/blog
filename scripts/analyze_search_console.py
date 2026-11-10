"""Read a Search Console CSV directory without modifying the source export."""
import argparse
import csv
from datetime import date, timedelta
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('directory', type=Path)
parser.add_argument('--as-of', type=date.fromisoformat, default=date.today())
args = parser.parse_args()


def read(*names):
    for name in names:
        path = args.directory / name
        if path.exists():
            with path.open(encoding='utf-8-sig', newline='') as source:
                return list(csv.DictReader(source))
    raise SystemExit(f'Missing export: {names[0]}')


def value(row, *keys):
    for key in keys:
        if key in row:
            return row[key]
    raise SystemExit(f'Missing column {keys[0]}')


def number(row, *keys):
    raw = value(row, *keys)
    return float(raw.replace(',', '.')) if raw else 0.0


def cell(text):
    return str(text).replace('|', '\\|').replace('\n', ' ')


def table(rows, label_keys):
    print('| Consulta o página | Clics | Impresiones | CTR | Posición |')
    print('| --- | ---: | ---: | ---: | ---: |')
    for row in rows:
        print('| ' + ' | '.join(cell(value(row, *keys)) for keys in [label_keys, ('Clics', 'Clicks'), ('Impresiones', 'Impressions'), ('CTR',), ('Posición', 'Position')]) + ' |')


queries = read('Consultas.csv', 'Queries.csv')
pages = read('Páginas.csv', 'Pages.csv')
days = read('Gráfico.csv', 'Chart.csv')
filters = read('Filtros.csv', 'Filters.csv')
clicks = sum(number(row, 'Clics', 'Clicks') for row in days)
impressions = sum(number(row, 'Impresiones', 'Impressions') for row in days)
print('# Revisión de Search Console\n')
print(f'Fuente: `{args.directory.name}`. Fecha de revisión: {args.as_of}.\n')
print('Filtros de la exportación: ' + '; '.join(' = '.join(row.values()) for row in filters) + '.\n')
print(f'Fechas disponibles: {days[0][next(iter(days[0]))]} a {days[-1][next(iter(days[-1]))]}.')
print(f'Totales diarios: {clicks:g} clics, {impressions:g} impresiones, CTR {(clicks / impressions * 100 if impressions else 0):.2f}%.\n')
print('Las consultas y las páginas son agregados separados: no permiten unir una consulta con una URL ni demostrar canibalización. Las impresiones no son volumen mensual de búsqueda.\n')
print('## Consultas con posición entre 5 y 15\n')
selected = sorted((r for r in queries if 5 <= number(r, 'Posición', 'Position') <= 15), key=lambda r: -number(r, 'Impresiones', 'Impressions'))
table(selected, ('Consultas principales', 'Top queries'))
print('\n## Páginas con posición entre 5 y 15, ordenadas por impresiones\n')
selected_pages = sorted((r for r in pages if 5 <= number(r, 'Posición', 'Position') <= 15), key=lambda r: -number(r, 'Impresiones', 'Impressions'))
table(selected_pages, ('Páginas principales', 'Top pages'))
print('\n## Pausa editorial de 60 días\n')
print('Estas páginas se omiten de nuevas reescrituras durante la pausa propuesta por el artículo. Esto no garantiza cuándo Google vuelve a rastrearlas.\n')
for path in sorted(Path('_posts').glob('*.md')):
    front = path.read_text().split('---', 2)[1]
    fields = dict(line.split(':', 1) for line in front.splitlines() if ':' in line and not line.startswith(' '))
    modified = fields.get('updatedDate', fields.get('date', '')).strip(' "')[:10]
    if modified and args.as_of - timedelta(days=60) <= date.fromisoformat(modified) <= args.as_of:
        print(f'- `{path.name}`: {modified}.')
print('\nCada lunes: exportar los últimos 28 días y el período anterior comparable; revisar hasta tres páginas elegibles por impresiones. Filtrar cada consulta en Search Console y abrir Páginas para confirmar la URL y posibles competidores internos antes de editar.\n')
