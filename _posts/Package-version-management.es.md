---
title: "Gestión de versiones de paquetes"
section: "Python"
language: "es"
excerpt: "Una guía práctica para versionar paquetes de Python con SemVer, etiquetas de Git y un changelog claro."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-26T05:35:07.322Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

# Gestión de versiones de paquetes

Esta guía usa el versionado semántico (SemVer) como base para gestionar las versiones de paquetes de Python.

# Conceptos básicos

El esquema clásico es `MAJOR.MINOR.PATCH`:

```bash
0.1.0
0.1.1
0.2.0
1.0.0
```

Cada número tiene un significado:

- **PATCH:** correcciones compatibles con versiones anteriores: `1.2.4 → 1.2.5`.
- **MINOR:** funciones nuevas que mantienen la compatibilidad: `1.2.4 → 1.3.0`.
- **MAJOR:** cambios incompatibles: `1.3.0 → 2.0.0`.

# Cuándo crear una versión nueva

Se crea una versión cuando el proyecto alcanza un estado **instalable, identificable y reutilizable**.

Si corriges un error sin romper compatibilidad, incrementa PATCH. Si añades una función compatible, incrementa MINOR. Si cambias una API de forma que obliga a modificar los repositorios dependientes, incrementa MAJOR.

Una duda frecuente es cuándo publicar `1.0.0`. La recomendación de SemVer es hacerlo cuando el software ya se usa en producción o tiene una API estable de la que dependen otros usuarios.

# PEP 440: versiones de Python

Python define en PEP 440 cómo escribir las versiones. Admite versiones estables:

```bash
1.0.0
1.1.0
2.0.1
```

y versiones de desarrollo:

```bash
1.2.0a1
1.2.0b1
1.2.0rc1
1.2.0
```

Sus sufijos representan:

```bash
a -> alpha
b -> beta
rc -> release candidate
sin sufijo -> versión estable
```

No siempre necesitas estas variantes en proyectos pequeños; su uso depende del proceso de publicación.

# Versión del paquete + etiqueta de Git

Es recomendable asociar cada versión publicada con una etiqueta de Git. Una **Git tag** apunta a un commit concreto y permite identificar exactamente qué código generó, por ejemplo, el paquete `v0.3.0`.

Primero confirma y sube los cambios a `main` o `master`. Después crea la etiqueta:

```bash
git tag -a v0.2.0 -m "NOMBRE_DEL_COMMIT"
```

El resultado relaciona la versión con el commit:

```bash
commit abc123
    ↑
  v0.2.0
```

Por último, sube la etiqueta a Forgejo:

```bash
git push origin v0.2.0
```

> Un `git push` normal no suele subir las etiquetas. Por eso se envía explícitamente `v0.2.0`.

# Cómo declarar dependencias

Puedes fijar una versión exacta:

```text
"example-package==0.3.1"
```

Sin embargo, así no recibirás automáticamente correcciones. Suele ser más práctico permitir actualizaciones PATCH dentro de la misma versión MINOR:

```text
"example-package>=0.3.1,<0.4"
```

# Changelog

En paquetes privados conviene mantener un registro de los cambios de cada versión. Ayuda a responder preguntas como: «¿puedo actualizar de `0.2.1` a `0.3.0`?».

Un formato posible es:

```markdown
# Changelog

## 0.3.0

### Added
- Added NRLMSISE atmospheric model.
- Added configurable solar activity.

### Changed
- Improved atmospheric interpolation.

### Fixed
- Fixed density calculation above 500 km.

## 0.2.1

### Fixed
- Fixed invalid temperature interpolation.

## 0.2.0

### Added
- Initial atmospheric interpolation support.
```

# Ten en cuenta

1. El software que usa SemVer debe declarar una API pública, ya sea en el código o en la documentación. Debe ser precisa y completa.
2. Una versión publicada no debe modificarse. Cualquier cambio debe publicarse como una versión nueva.
3. La versión `1.0.0` define la API pública. Los incrementos posteriores dependen de cómo cambie esa API.

# Fuentes

- [Semantic Versioning](https://semver.org/)
- [PEP 440](https://peps.python.org/pep-0440/)
