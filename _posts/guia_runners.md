---
title: "Guia runners"
section: "Forgejo"
language: "es"
excerpt: "Esta guia toma como base el la maquina ubuntu desplegada junto con un primer runner funcional."
coverImage: "/assets/blog/editorial-cover.png"
date: "2026-08-16T05:35:07.322Z"
author:
  name: Sergio Rodriguez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/editorial-cover.png"
---


# Guía de runners

esta guia es para añadir un runner a un nuevo repositorio en una máquina donde ya funciona otro. Los nombres de proyectos, rutas y dirección del servidor que aparecen abajo son ejemplos; cámbialos por los de tu instalación.

### Crear directorio del nuevo repo

mediante el usuario root

nos movemos a 

```bash
cd /srv/forgejo-runners
```

en esta carpeta se encuentran las carpetas de los distintos repos 

creamos la nueva carpeta para el nuevo repo

```bash
mkdir proyecto-nuevo
```

### Clonar los archivos base de otro repo

en este paso usaremos como referencia los archivos de un repositorio de ejemplo llamado `proyecto-base`

copiaremos el archivo compose.yml y el runner-config, este ultimo ira dentro de la carpeta data 

(los archivos pueden ser .yml como .yaml pero todos tienen que tener la misma terminacion)

la estructura seria la siguiente:

de momento crea manualmente las carpetas con mkdir

```bash
/srv/forgejo-runners

	/proyecto-base
		compose.yml
		/data
			runner-config.yml
		/data-proyecto-base
			archivos de la carpeta data necesarios para los test

	/proyecto-nuevo
		compose.yml
		/data
			runner-config.yml
		/data-proyecto-nuevo
			archivos de la carpeta data necesarios para los test
		
		
	/otro-proyecto
		.................................
```

los comandos para copiar estos archivos pueden ser varios,  como ejemplo tomaremos: 

```bash
sudo cp proyecto-base/compose.yml proyecto-nuevo/compose.yml
```

y 

```bash
sudo mkdir -p proyecto-nuevo/data
sudo cp proyecto-base/data/runner-config.yml proyecto-nuevo/data/runner-config.yml

```

## Configuración de los archivos

### Compose.yml

con nano compose.yml en la ubicación del archivo se tendrán que modificar los siguientes parámetros 

```bash

en dind

volumes:
      - dind-data-proyecto-base:/var/lib/docker
      - /srv/forgejo-runners/shared/data:/shared/data:ro
      - type: bind
        source: ./data-proyecto-base
        target: /srv/forgejo-runners/proyecto-base/data-proyecto-base
        read_only: true
        
cambia las siguientes lineas 
			- dind-data-proyecto-base:/var/lib/docker por dind-data-proyecto-nuevo:/var/lib/docker
			..
			..
			..
				source: ./data-proyecto-base por source: ./data-proyecto-nuevo
				target: /srv/forgejo-runners/proyecto-base/data-proyecto-base por la nueva ruta de la carpeta data del proyecto
	 
```

si bajamos al final del archivo nos encontramos con: 

```bash
volumes:
  dind-data-proyecto-base:
    name: forgejo_proyecto_base_dind-data
    
    cambia la clave y el nombre por unos descriptivos para el nuevo volumen
```

para validar estos cambios usa:

```bash
cd /srv/forgejo-runners/proyecto-nuevo

sudo docker compose -p proyecto-nuevo config
```

### Runner-config.yml

antes de configurar este paso tendremos que crear el nuevo runner en forgejo

en:

```bash
Abre el repositorio.
Entra en Settings.
Entra en Actions → Nodos/runners(dependera del idioma).
Selecciona Create new runner.
Nombre: runner-proyecto-nuevo
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
    - python-unit:docker://docker.io/library/python:3.12
    
    cambiamos solo la primera parte python-unit: por el nombre que le queramos 
    poner a la etiqueta de este runner
```

si bajamos mas encontraremos en el apartado **container:**

```bash
 options: >-
    --volume /srv/forgejo-runners/proyecto-base/data-proyecto-base:/test-data:ro
    --memory=16g
    --memory-swap=16g
    --cpus=2
    --pids-limit=256
    --add-host=forgejo.example.com:192.0.2.10
    
    
    
    cambiaremos la primera ruta por la ruta de la nueva carpeta data
    
    el dominio y la IP de `--add-host` son ejemplos; usa los de tu servidor solo si necesitas resolverlo de esta forma

    los siguientes parametros son de LIMITES de uso del runner
    las cpus tal como corren los test se podrian dejar en 1
    
    si bajamos mas nos encontramos con:
    
    valid_volumes:
    - /srv/forgejo-runners/proyecto-base/data-proyecto-base
    
    aqui volveremos a poner la nueva ruta de la carpeta data-proyecto-nuevo
    
    y por ultimo al final del todo nos encontraremos con:
    
    connections:
    proyecto-nuevo:
      url: https://forgejo.example.com/
      uuid: "UUID_DEL_RUNNER"
      token: "TOKEN_DEL_RUNNER"
      
      
      aqui cambiaremos el nombre, la URL, el UUID y el token por los datos generados anteriormente
      
      
```

## Pasar la carpeta data que usaran los test

Desde la maquina donde tengamos la carpeta data

```bash
rsync -avh --progress \
  ./data/ \
  usuario@SERVIDOR:/srv/forgejo-runners/proyecto-nuevo/data-proyecto-nuevo/
```

la primera ubicación es la carpeta en nuestro PC y la segunda es donde la queremos copiar. Sustituye `usuario` y `SERVIDOR` por tus datos de acceso.

## Arrancar el runner

con: 

```bash
cd /srv/forgejo-runners/proyecto-nuevo

sudo docker compose -p proyecto-nuevo up -d
```

comprobamos el estado:

```bash
sudo docker compose -p proyecto-nuevo ps
```

vemos los logs por si sucedió algún error:

```bash
sudo docker compose -p proyecto-nuevo logs --tail=100
```
