---
title: "Monitorización de equipos y sesiones RDP"
section: "Infraestructura"
language: "es"
excerpt: "Cómo centralizar el estado de equipos compartidos y distinguir el uso local de las sesiones RDP con PowerShell, FastAPI y SQLite."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-09-17T10:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/editorial-cover.png"
---

# Monitorización de equipos y sesiones RDP en una infraestructura compartida

## Introducción

En entornos de desarrollo donde varios usuarios comparten una misma infraestructura de ordenadores, uno de los problemas más habituales es saber **qué equipos están disponibles, cuáles están siendo utilizados y si existe alguna sesión remota activa**.

Este problema se vuelve especialmente importante cuando los equipos se utilizan tanto de forma local como mediante **Remote Desktop Protocol (RDP)**. Sin un sistema centralizado de monitorización, comprobar si un ordenador puede reiniciarse, si existe alguien trabajando en él o si es seguro detener determinados procesos requiere realizar comprobaciones manuales.

Para resolver este problema desarrollé una pequeña infraestructura de monitorización formada por tres componentes principales:

- Un **agente instalado en cada ordenador**.
- Una **API central** encargada de recibir y almacenar el estado.
- Una **interfaz web** desde la que consultar todos los equipos.

La solución permite distinguir entre equipos disponibles, ocupados o desconectados y detectar si la utilización del ordenador es local o remota.

---

# El problema inicial

La infraestructura estaba formada por diferentes equipos Windows utilizados por varios usuarios.

Un mismo ordenador podía encontrarse en distintos estados:

```
READY
OCCUPIED
OFFLINE
```

Sin embargo, conocer este estado requería comprobar cada máquina de manera individual.

Además, un ordenador podía estar siendo utilizado localmente:

```
Usuario local
      |
      v
     PC
```

o mediante una conexión remota:

```
Usuario
   |
   | RDP
   v
  PC
```

Esto generaba varias dificultades.

Por ejemplo, antes de reiniciar un ordenador utilizado para tareas de desarrollo o cálculo era necesario comprobar que ningún usuario estuviese trabajando en él.

El objetivo era disponer de un punto central desde el que poder observar algo similar a:

```
PC-01     READY
PC-02     OCCUPIED    LOCAL
PC-03     OCCUPIED    RDP
PC-04     OFFLINE
```

---

# Arquitectura de la solución

La arquitectura implementada sigue un modelo cliente-servidor sencillo.

```
 ┌────────────────────┐
 │      PC Windows    │
 │                    │
 │  PowerShell Agent  │
 └─────────┬──────────┘
           │
           │ HTTP
           ▼
 ┌────────────────────┐
 │     FastAPI API    │
 │                    │
 │ Estado de equipos  │
 │ Sesiones RDP       │
 └─────────┬──────────┘
           │
           ▼
 ┌────────────────────┐
 │       SQLite       │
 │                    │
 │ computers          │
 │ rdp_clients        │
 └─────────┬──────────┘
           │
           ▼
 ┌────────────────────┐
 │        Web         │
 │                    │
 │    PC Monitor      │
 └────────────────────┘
```

El servidor central se ejecuta sobre una máquina Linux dentro de la red interna.

Los ordenadores Windows ejecutan periódicamente un agente desarrollado en PowerShell que detecta el estado del equipo y lo envía a la API.

---

# Agente instalado en los ordenadores

Para evitar instalar aplicaciones complejas en cada máquina, el agente se desarrolló como un script de PowerShell.

Su responsabilidad principal consiste en recopilar información sobre el estado del equipo y enviarla al servidor.

Un ejemplo simplificado sería:

```powershell
$body = @{
    hostname        = $env:COMPUTERNAME
    status          = "OCCUPIED"
    connection_type = "LOCAL"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://monitor-interno/api/status" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

De esta forma, cada ordenador actúa como un pequeño cliente del sistema de monitorización.

Un mensaje enviado al servidor podría tener la siguiente estructura:

```json
{
  "hostname": "PC-03",
  "status": "OCCUPIED",
  "connection_type": "RDP"
}
```

El agente se ejecuta automáticamente mediante una tarea programada de Windows.

Por ejemplo:

```powershell
schtasks /Query /TN "\PC Status Agent"
```

La tarea puede lanzar un script almacenado localmente:

```
C:\Program Files\PCStatusAgent\pc_state_agent.ps1
```

De esta forma, el sistema de monitorización no depende de que el usuario ejecute manualmente ningún programa.

---

# API central con FastAPI

El servidor recibe los datos mediante una API desarrollada con **FastAPI**.

Un ejemplo simplificado del endpoint de actualización podría ser:

```python
@app.post("/api/status")
def update_pc_status(data: PCStatus):

    if (
        data.status == "OCCUPIED"
        and data.connection_type is None
    ):
        raise HTTPException(
            status_code=400,
            detail="OCCUPIED requires connection_type"
        )

    now = datetime.now(timezone.utc)

    with get_db() as db:

        db.execute(
            """
            INSERT INTO computers (
                hostname,
                status,
                connection_type,
                last_seen
            )
            VALUES (?, ?, ?, ?)

            ON CONFLICT(hostname)
            DO UPDATE SET
                status = excluded.status,
                connection_type = excluded.connection_type,
                last_seen = excluded.last_seen
            """,
            (
                data.hostname,
                data.status,
                data.connection_type,
                now
            )
        )
```

Cada vez que un agente envía información, el servidor actualiza el registro correspondiente.

La base de datos mantiene así el último estado conocido de cada ordenador.

---

# Detección de equipos desconectados

Uno de los problemas adicionales era detectar cuándo un ordenador había dejado de enviar información.

No era suficiente almacenar únicamente:

```
READY
OCCUPIED
```

porque un ordenador apagado simplemente dejaría de comunicarse con el servidor.

Para resolverlo se almacena el momento de la última comunicación:

```
last_seen
```

La lógica puede representarse de forma simplificada como:

```python
if now - last_seen > timedelta(seconds=60):
    status = "OFFLINE"
```

Por tanto, el estado `OFFLINE` puede determinarse a partir del tiempo transcurrido desde la última comunicación del agente.

---

# Identificación de sesiones RDP

Una de las partes más interesantes del proyecto fue gestionar correctamente las conexiones mediante RDP.

El sistema necesita distinguir entre:

```
OCCUPIED + LOCAL
```

y:

```
OCCUPIED + RDP
```

Esto permite conocer no solo si el ordenador está ocupado, sino también cómo está siendo utilizado.

Para mantener información adicional sobre los clientes RDP puede utilizarse una tabla independiente:

```sql
CREATE TABLE rdp_clients(
    client_hostname TEXT PRIMARY KEY,
    name TEXT
);
```

Por motivos de privacidad, el nombre mostrado en esta tabla puede sustituirse por un alias o identificador interno.

Por ejemplo:

```
CLIENT-01 | USER-01
CLIENT-02 | USER-02
CLIENT-03 | USER-03
```

Cuando el sistema detecta una conexión procedente de:

```
CLIENT-02
```

puede consultar:

```sql
SELECT name
FROM rdp_clients
WHERE client_hostname = 'CLIENT-02';
```

y mostrar el identificador asociado en la interfaz.

---

# Problemas encontrados

Durante el desarrollo aparecieron algunos problemas que inicialmente no eran evidentes.

Uno de ellos fue que determinados identificadores proporcionados por el sistema operativo no eran necesariamente únicos.

Por ejemplo, dos ordenadores diferentes podían utilizar el mismo nombre de usuario:

```
PC-A
username = shared-user

PC-B
username = shared-user
```

Si el sistema dependiese únicamente del nombre de usuario, aparecería una ambigüedad:

```
shared-user → ¿PC-A o PC-B?
```

Esto mostró que un nombre de usuario no siempre es suficiente como identificador.

Para evitar depender exclusivamente de este valor, se puede mantener una asociación adicional basada en el equipo cliente o en identificadores internos.

Por ejemplo:

```sql
UPDATE rdp_clients
SET name = 'USER-02'
WHERE client_hostname = 'CLIENT-02';
```

De esta forma, las asociaciones pueden corregirse directamente desde la base de datos sin necesidad de modificar el código de la aplicación.

---

# Gestión y mantenimiento

Una ventaja de mantener una arquitectura relativamente sencilla es que muchas operaciones de mantenimiento pueden realizarse directamente sobre SQLite.

Para consultar los equipos registrados:

```sql
SELECT * FROM computers;
```

Para consultar las asociaciones RDP:

```sql
SELECT * FROM rdp_clients;
```

Para eliminar un ordenador que ya no pertenece a la infraestructura:

```sql
DELETE FROM computers
WHERE hostname = 'PC-XX';
```

Y para eliminar una asociación RDP antigua:

```sql
DELETE FROM rdp_clients
WHERE client_hostname = 'CLIENT-XX';
```

Esto resulta especialmente útil cuando un ordenador cambia de nombre, es reinstalado o deja de utilizarse.

---

# Flujo completo del sistema

El funcionamiento completo puede resumirse mediante el siguiente flujo:

```
Windows PC
    |
    | PowerShell Agent
    |
    | POST /api/status
    v
FastAPI
    |
    | UPDATE / INSERT
    v
SQLite
    |
    | SELECT
    v
Web Interface
```

Cada ordenador comunica periódicamente su estado.

El servidor centraliza los datos y la interfaz web consulta esa información para mostrar el estado actual de la infraestructura.

Un dashboard simplificado podría mostrar:

```
┌────────────────────────────────────────────┐
│ PC Monitor                                 │
├──────────┬───────────┬─────────────────────┤
│ PC       │ Status    │ Connection          │
├──────────┼───────────┼─────────────────────┤
│ PC-01    │ READY     │ -                   │
│ PC-02    │ OCCUPIED  │ LOCAL               │
│ PC-03    │ OCCUPIED  │ RDP                 │
│ PC-04    │ OFFLINE   │ -                   │
└──────────┴───────────┴─────────────────────┘
```

---

# Infraestructura

La solución no requiere una infraestructura especialmente compleja.

Los componentes principales son:

```
Windows PCs
    │
    │ PowerShell
    ▼
Red interna
    │
    ▼
Linux Server
    │
    ├── FastAPI
    ├── SQLite
    └── Web Monitor
```

Toda la lógica principal permanece centralizada en el servidor.

Los equipos cliente únicamente necesitan ejecutar un pequeño agente encargado de comunicar su estado.

La separación entre componentes también facilita futuras modificaciones.

Por ejemplo, la base de datos podría sustituirse por otro sistema de almacenamiento manteniendo sin cambios el protocolo utilizado por los agentes.

---

# Resultado

El resultado es una herramienta interna que centraliza información que anteriormente tenía que comprobarse manualmente en diferentes máquinas.

El sistema permite consultar rápidamente:

- Qué ordenadores están disponibles.
- Qué ordenadores están siendo utilizados.
- Si la utilización es local o mediante RDP.
- Cuándo se recibió la última actualización de cada equipo.
- Qué máquinas han dejado de comunicarse con el servidor.

Además, la arquitectura permite incorporar nuevas métricas en el futuro.

Por ejemplo:

```
CPU usage
RAM usage
GPU usage
Docker containers
Active sessions
Running jobs
Last activity
```

Esto permitiría evolucionar desde un simple monitor de disponibilidad hacia una herramienta más completa de supervisión de recursos compartidos.

---

# Conclusión

El reto principal del proyecto no consistía únicamente en detectar si un ordenador estaba encendido, sino en determinar de forma automática **si estaba disponible, ocupado o desconectado y qué tipo de conexión estaba activa**.

La combinación de un pequeño agente PowerShell, una API desarrollada con FastAPI, una base de datos SQLite y una interfaz web permitió construir una solución ligera y adaptada a una infraestructura de equipos compartidos.

Además, durante el desarrollo aparecieron problemas interesantes relacionados con la identificación de sesiones remotas, la falta de unicidad de algunos identificadores del sistema operativo y la gestión de equipos que dejan de comunicarse.

El resultado final transforma una comprobación manual distribuida entre diferentes ordenadores en un sistema centralizado desde el que puede consultarse rápidamente el estado general de la infraestructura.
