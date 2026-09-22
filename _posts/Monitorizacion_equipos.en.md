---
title: "Monitoring computers and RDP sessions"
section: "Infrastructure"
language: "en"
excerpt: "How to centralize the status of shared computers and distinguish local use from RDP sessions with PowerShell, FastAPI and SQLite."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-09-17T10:00:00.000Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/social-preview.png"
---

# Monitoring computers and RDP sessions in shared infrastructure

## Introduction

In development environments where several people share a pool of computers, it is often difficult to know which machines are available, which are in use, and whether a remote session is active.

This matters when machines are used both locally and through Remote Desktop Protocol (RDP). Without centralized monitoring, checking whether a computer can be restarted or whether somebody is working on it becomes a manual task.

The solution described here has three main components:

- an agent installed on each computer;
- a central API that receives and stores status updates;
- a web interface that displays every machine.

It distinguishes between available, occupied and disconnected machines, as well as local and remote use.

# The initial problem

Each Windows computer could have one of these states:

```text
READY
OCCUPIED
OFFLINE
```

A computer might be used locally:

```text
Local user
    |
    v
   PC
```

or through RDP:

```text
User
  |
  | RDP
  v
 PC
```

Before restarting a development or compute machine, we needed to verify that nobody was using it. The goal was to provide one central view:

```text
PC-01     READY
PC-02     OCCUPIED    LOCAL
PC-03     OCCUPIED    RDP
PC-04     OFFLINE
```

# Solution architecture

The implementation follows a small client-server model:

```text
 ┌────────────────────┐
 │     Windows PC     │
 │  PowerShell Agent  │
 └─────────┬──────────┘
           │ HTTP
           ▼
 ┌────────────────────┐
 │    FastAPI API     │
 │ Computer status    │
 │ RDP sessions       │
 └─────────┬──────────┘
           ▼
 ┌────────────────────┐
 │       SQLite       │
 │ computers          │
 │ rdp_clients        │
 └─────────┬──────────┘
           ▼
 ┌────────────────────┐
 │        Web         │
 │     PC Monitor     │
 └────────────────────┘
```

The central service runs on a Linux machine on the internal network. Windows computers periodically run a PowerShell agent that detects their state and sends it to the API.

# Agent installed on the computers

The agent is a PowerShell script, which avoids installing a complex application on every machine. It collects the state and sends it to the server:

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

A message received by the server might look like this:

```json
{
  "hostname": "PC-03",
  "status": "OCCUPIED",
  "connection_type": "RDP"
}
```

The agent runs automatically as a Windows scheduled task:

```powershell
schtasks /Query /TN "\PC Status Agent"
```

The task can launch a locally stored script:

```text
C:\Program Files\PCStatusAgent\pc_state_agent.ps1
```

The monitor therefore does not depend on a user starting anything manually.

# Central FastAPI service

The server receives updates through a FastAPI endpoint. A simplified version is:

```python
@app.post("/api/status")
def update_pc_status(data: PCStatus):
    if data.status == "OCCUPIED" and data.connection_type is None:
        raise HTTPException(
            status_code=400,
            detail="OCCUPIED requires connection_type"
        )

    now = datetime.now(timezone.utc)

    with get_db() as db:
        db.execute(
            """
            INSERT INTO computers (
                hostname, status, connection_type, last_seen
            )
            VALUES (?, ?, ?, ?)
            ON CONFLICT(hostname)
            DO UPDATE SET
                status = excluded.status,
                connection_type = excluded.connection_type,
                last_seen = excluded.last_seen
            """,
            (data.hostname, data.status, data.connection_type, now)
        )
```

Every message updates the relevant row, so the database always holds the last known state of each computer.

# Detecting disconnected computers

Storing only `READY` and `OCCUPIED` is not enough: a powered-off machine simply stops talking to the server. The API therefore stores the time of the last update in `last_seen`.

The simplified rule is:

```python
if now - last_seen > timedelta(seconds=60):
    status = "OFFLINE"
```

`OFFLINE` is derived from the time elapsed since the agent last checked in.

# Identifying RDP sessions

The system must distinguish `OCCUPIED + LOCAL` from `OCCUPIED + RDP`. This tells us both whether a computer is busy and how it is being used.

Additional information about RDP clients can live in a separate table:

```sql
CREATE TABLE rdp_clients(
    client_hostname TEXT PRIMARY KEY,
    name TEXT
);
```

For privacy, the displayed name can be an alias or internal identifier:

```text
CLIENT-01 | USER-01
CLIENT-02 | USER-02
CLIENT-03 | USER-03
```

When a connection comes from `CLIENT-02`, the application can look up the associated identifier:

```sql
SELECT name
FROM rdp_clients
WHERE client_hostname = 'CLIENT-02';
```

# Problems found during development

Some values exposed by the operating system are not unique. Two computers can, for example, report the same username:

```text
PC-A
username = shared-user

PC-B
username = shared-user
```

Using that value alone creates an ambiguity: `shared-user → PC-A or PC-B?`

The system should therefore keep an additional association based on the client machine or another internal identifier. Administrators can correct mappings directly in the database without changing application code:

```sql
UPDATE rdp_clients
SET name = 'USER-02'
WHERE client_hostname = 'CLIENT-02';
```

# Management and maintenance

The deliberately small architecture makes common maintenance operations straightforward in SQLite:

```sql
-- Registered computers
SELECT * FROM computers;

-- RDP mappings
SELECT * FROM rdp_clients;

-- Remove a retired computer
DELETE FROM computers
WHERE hostname = 'PC-XX';

-- Remove an old RDP mapping
DELETE FROM rdp_clients
WHERE client_hostname = 'CLIENT-XX';
```

This is useful when a machine is renamed, reinstalled or removed from the infrastructure.

# Complete system flow

```text
Windows PC
    |
    | PowerShell Agent
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

Each computer periodically reports its state. The server centralizes those updates and the web interface reads them to present the current state:

```text
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

# Infrastructure

The solution does not require a complex platform:

```text
Windows PCs
    │ PowerShell
    ▼
Internal network
    ▼
Linux Server
    ├── FastAPI
    ├── SQLite
    └── Web Monitor
```

The main logic remains on the server. Clients only run a small reporting agent. This separation also makes future changes easier: the storage layer, for example, could be replaced without changing the protocol used by the agents.

# Result

The resulting internal tool quickly shows:

- which computers are available;
- which computers are in use;
- whether use is local or through RDP;
- when each computer last reported its status;
- which machines have stopped communicating.

The design can later include metrics such as CPU, RAM or GPU use, Docker containers, active sessions, running jobs and last activity. A simple availability monitor can thus grow into a fuller shared-resource observability tool.

# Conclusion

The real challenge was not merely detecting whether a computer was powered on. It was automatically determining **whether it was available, occupied or offline and what kind of connection was active**.

A small PowerShell agent, FastAPI, SQLite and a web interface provide a lightweight solution tailored to shared computers. The result turns checks previously scattered across several machines into one centralized overview of the entire infrastructure.
