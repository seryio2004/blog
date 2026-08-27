---
title: "Guia runners"
section: "Forgejo"
language: "es"
excerpt: "Esta guia toma como base el la maquina ubuntu desplegada junto con un primer runner funcional."
coverImage: "/assets/blog/guia_runners/runner.jpg"
date: "2026-08-16T05:35:07.322Z"
author:
  name: Nigi nigez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---


# Guía v4

esta guia es para los nuevos repos en la maquina existente 

### Crear directorio del nuevo repo

mediante el usuario root

nos movemos a 

```bash
cd /srv/forgejo-runners
```

en esta carpeta se encuentran las carpetas de los distintos repos 

creamos la nueva carpeta para el nuevo repo

```bash
mkdir repoxxxxxx
```

### Clonar los archivos base de otro repo

en este paso usaremos como referencia los archivos de nexus-ci2

copiaremos el archivo compose.yml y el runner-config, este ultimo ira dentro de la carpeta data 

(los archivos pueden ser .yml como .yaml pero todos tienen que tener la misma terminacion)

la estructura seria la siguiente:

de momento crea manualmente las carpetas con mkdir

```bash
/srv/forgejo-runners

	/nexus-ci2
		compose.yml
		/data
			runner-config.yml
		/data-nexus 
			archivos de la carpeta data necesarios para los test

	/repoxxxx
		compose.yml
		/data
			runner-config.yml
		/data-repoxxxx
			archivos de la carpeta data necesarios para los test
		
		
	/repoyyyyy
		.................................
```

los comandos para copiar estos archivos pueden ser varios,  como ejemplo tomaremos: 

```bash
sudo cp nexus-ci2/compose.yml repoxxxx/compose.yml
```

y 

```bash
sudo cp nexus-ci2/data/runner-config.yml repoxxxx/data/runner-config.yml

```

## Configuración de los archivos

### Compose.yml

con nano compose.yml en la ubicación del archivo se tendrán que modificar los siguientes parámetros 

```bash

en dind

volumes:
      - dind-data-ci2:/var/lib/docker
      - /srv/forgejo-shared/data:/shared/data:ro
      - type: bind
        source: ./data-nexus
        target: /srv/forgejo-runners/nexus-ci2/data-nexus
        read_only: true
        
cambia las siguientes lineas 
			- dind-data-ci2:/var/lib/docker por dind-data-repoxxx
			..
			..
			..
				target: /srv/forgejo-runners/nexus-ci2/data-nexus  por la nueva ruta de la carpeta data del repo xxx
	 
```

si bajamos al final del archivo nos encontramos con: 

```bash
volumes:
  dind-data-ci2:
    name: forgejo_nexus_ci2_dind-data
    
    cambia el nombre por un nombre descriptivo del volumen
```

para validar estos cambios usa:

```bash
cd /opt/forgejo-runners/repoxxxx

sudo docker compose -p nombreDelContedorXXXx config
```

### Runner-config.yml

antes de configurar este paso tendremos que crear el nuevo runner en forgejo

en:

```bash
Abre el repositorio.
Entra en Settings.
Entra en Actions → Nodos/runners(dependera del idioma).
Selecciona Create new runner.
Nombre: nombreDescriptivo 
Guarda por separado:
URL de Forgejo.
UUID.
Token.
MUY IMPORTANTE GUARDARLOS, una vez se sale de esta ventana no seran visibles
```

una vez anotados los datos: 

```bash
nano runner-config.yml
```

bajamos hasta encontrar:

```bash
labels:
    - python-unit:docker://docker.io/library/node:22-bookworm
    
    cambiamos solo la primera parte python-unit: por el nombre que le queramos 
    poner a la etiqueta de este runner
```

si bajamos mas encontraremos en el apartado **container:**

```bash
 options: >-
    --volume /srv/forgejo-runners/nexus-ci2/data-nexus:/nexus-data:ro
    --memory=16g
    --memory-swap=16g
    --cpus=2
    --pids-limit=256
    --add-host=repos.internal:192.168.30.250
    
    
    
    cambiaremos la primera ruta por la ruta de la nueva carpeta data
    
    los siguientes parametros son de LIMITES de uso del runner
    las cpus tal como corren los test se podrian dejar en 1
    
    si bajamos mas nos encontramos con:
    
    valid_volumes:
    - /srv/forgejo-runners/nexus-ci2/data-nexus
    
    aqui volveremos a poner la nueva ruta de la carpeta data-repoxxxx
    
    y por ultimo al final del todo nos encontraremos con:
    
    connections:
    repositorio-CI_CD_Tests:
      url: https://repos.internal/
      uuid: "xxxxxxxxxxxxxxxxxxxxx"
      token: "xxxxxxxxxxxxxxxxxxxxxxxxx"
      
      
      aqui cambiaremos los datos por el nombre del repo y el toke y uuid generados anteriormente
      la url se mantiene
      
      
```

## Pasar la carpeta data que usaran los test

Desde la maquina donde tengamos la carpeta data

```bash
rsync -avh --progress \
  ~/real/nexus_CI/data/ \
  kreios@IP_MAQUINA:/srv/nexus-data/
  
  la primera ubicacion es la carpeta en nuestro pc y la segunda es donde la queremos pegar
 

```

## Arrancar el runner

con: 

```bash
cd /srv/forgejo-runners/repoxxxx

sudo docker compose -p nombreContenedor up -d
```

comprobamos el estado:

```bash
sudo docker compose -p nombreContenedor ps
```

vemos los logs por si sucedió algún error:

```bash
sudo docker compose -p nombreContenedor logs --tail=100
```

[Guia-v4-GPU](https://app.notion.com/p/Guia-v4-GPU-3bb5e432a97e804a8045e29dd9602b38?pvs=21)
