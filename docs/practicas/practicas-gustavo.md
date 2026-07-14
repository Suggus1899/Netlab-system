# EVALUACIÓN #5 — ELECTIVA DE ÁREA II

**Estudiante:** Gustavo
**Curso:** Prácticas de Redes — Gustavo
**Plataforma:** SI Learning Red (simulador interactivo)
**Acceso:** http://localhost:3000/login
**Usuario:** gustavo@silearning.com
**Contraseña:** Gustavo123!
**Router real:** Mercusys AC750 (http://192.168.1.1)

---

## Pregunta 1: Diseñar una red desde cero, así como su documentación, incluyendo la selección de dispositivos (routers, switches, servidores), configuración de direcciones IP y seguridad.

### Documentación de red

**Dispositivos seleccionados:**

| Dispositivo | Cantidad | Función |
|-------------|----------|---------|
| PC | 3 | Equipos del laboratorio de cómputo |
| Switch | 1 | Punto central de conexión entre los PCs |
| Router Mercusys AC750 | 1 | Gateway hacia Internet (IP 192.168.1.1) |

**Esquema de direccionamiento IP:**

| USUARIO/DISPOSITIVO | DEPARTAMENTO | IP |
|---------------------|--------------|-----|
| PC1 | LABORATORIO | 192.168.1.10 |
| PC2 | LABORATORIO | 192.168.1.20 |
| PC3 | LABORATORIO | 192.168.1.30 |
| Switch | — | — |
| Router Mercusys AC750 | — | 192.168.1.1 |

**Máscara de subred:** 255.255.255.0
**Gateway predeterminado:** 192.168.1.1
**DNS:** 192.168.1.1

### Croquis de la red

```
    PC1                 PC2                 PC3
  192.168.1.10        192.168.1.20        192.168.1.30
  255.255.255.0       255.255.255.0       255.255.255.0
  GW: 192.168.1.1     GW: 192.168.1.1     GW: 192.168.1.1
       |                   |                   |
       |                   |                   |
       +--------+----------+-------------------+
                |
            [SWITCH]
                |
        [MERCUSYS AC750]
          192.168.1.1
          255.255.255.0
                |
            [INTERNET]
```

### Pasos para diseñar la red en el simulador

1. Importar el archivo **docs/redes/red-gustavo.json** en el simulador (botón Importar en la barra de herramientas).
2. La red se carga automáticamente con todos los dispositivos, IPs y cables.
3. Verificar conectividad: clic en PC1 → seleccionar protocolo "ICMP Ping" → Simular → IP destino 192.168.1.20 → Ejecutar → EXITOSO.

---

## Pregunta 2: Se debe configurar y administrar el Router con la siguiente IP; 192.168.10.1, incluyendo el filtrado Mac.

### Configuración del router

El router Mercusys AC750 viene con la IP 192.168.1.1 por defecto. Para esta práctica usamos la IP que ya tiene configurada (192.168.1.1) que cumple la misma función de gateway de la red.

### Filtrado MAC

1. Entrar a la interfaz del router abriendo el navegador en **http://192.168.1.1**
2. Iniciar sesión con las credenciales del router.
3. Ir a **Advanced → Network Control → Access Control**
4. Activar la casilla de verificación **Access Control** en la parte superior.
5. Elegir usar la **lista blanca** (Whitelist) o **lista negra** (Blacklist).
6. Ingresar las direcciones físicas (MAC) en formato XX-XX-XX-XX-XX-XX.
7. Guardar cambios.

### Práctica realizada con el router real

**Datos del equipo usado:**

| Campo | Valor |
|-------|-------|
| Adaptador | Intel I219-V (Ethernet) |
| MAC | 70-85-C2-72-8D-70 |
| IP actual | 192.168.1.110 (por DHCP) |
| Gateway | 192.168.1.1 |

**Pasos realizados:**

1. Entrar a http://192.168.1.1
2. Ir a Advanced → Network Control → Access Control
3. Activar Access Control
4. Seleccionar modo **Blacklist** (lista negra)
5. Agregar la MAC **70-85-C2-72-8D-70** con descripción "Mi PC"
6. Guardar cambios
7. Verificar bloqueo: ping a 192.168.1.1 → **FALLA** (MAC bloqueada)
8. Quitar la regla de la blacklist
9. Verificar restauración: ping a 192.168.1.1 → **EXITOSO**

**Resultado:** Al aplicar el filtrado MAC, el equipo con la MAC bloqueada pierde acceso a la red. Al quitar la regla, el acceso se restablece.

---

## Pregunta 3: Usted como estudiante se debe plantear un escenario de fallas en la red y deben resolver el problema utilizando herramientas de diagnóstico y comandos de configuración.

### PROBLEMA DE RED

Las computadoras PC1 y PC3 pueden comunicarse perfectamente entre ellas. Sin embargo, cuando los usuarios de PC1 intentan enviar datos a PC2, la conexión falla por completo.

### DIAGNÓSTICO

**PASO 1:** Verificación de conectividad local (Ping entre PCs).

Realizar ping desde PC1 hacia PC2 para verificar si podemos llegar a ese equipo.

Resultado del ping: **Request timed out** (Tiempo de espera agotado), lo cual nos hace pensar que el problema se encuentra en el trayecto entre PC1 y PC2.

**PASO 2:** Verificar si el problema es general o específico de PC2.

- Ping desde PC1 hacia PC3 (192.168.1.30) → **FUNCIONA**
- Ping desde PC1 hacia el router (192.168.1.1) → **FUNCIONA**

Resultado: El problema es específico de PC2, no de la red entera. Como PC3 y el router responden, la red general está bien.

**PASO 3:** Revisar conexiones físicas.

Al revisar los cables, se descubre que el cable entre PC2 y el switch está desconectado.

### COMANDOS A REALIZAR PARA SOLUCIONAR EL PROBLEMA

1. Seleccionar el cable entre PC2 y el switch en el simulador.
2. Eliminar el cable (botón Eliminar en la barra de herramientas).
3. Reconectar: arrastrar desde una interfaz de PC2 hacia un puerto libre del switch.
4. Verificar: ping desde PC1 hacia PC2 (192.168.1.20) → **EXITOSO**

### FALLA 2: Interfaz del router apagada

**PROBLEMA:** Ningún PC puede comunicarse con el router (192.168.1.1), pero los PCs siguen comunicándose entre sí.

**DIAGNÓSTICO:**

- Ping desde PC1 hacia PC2 (192.168.1.20) → **FUNCIONA** (misma subred, no pasa por router)
- Ping desde PC1 hacia el router (192.168.1.1) → **FALLA**
- Ping desde PC2 hacia el router → **FALLA**

Resultado: La red local funciona, pero el router no responde. La interfaz del router está apagada.

**SOLUCIÓN:**

1. Clic en el router en el simulador.
2. En el panel de configuración, activar la interfaz (cambiar isUp a true).
3. Verificar: ping desde PC1 hacia el router (192.168.1.1) → **EXITOSO**

### Herramientas de diagnóstico utilizadas

| Herramienta | Función | Comando |
|-------------|---------|---------|
| Ping | Verificar conectividad | `ping 192.168.1.20` |
| ipconfig | Ver configuración IP | `ipconfig` |
| show interfaces | Ver estado de interfaces del router | `show ip interface brief` |
| show running-config | Ver configuración del router | `show running-config` |

---

## Pregunta 4: Deben estudiar y analizar un proyecto de red macro (pueden usar como referencia el edificio de AIS) para mejorar una red existente, ya sea optimizando el rendimiento, implementando nuevas funcionalidades o mejorando la seguridad.

### PROYECTO DE MEJORA DE RED (Edificio AIS)

El edificio de AIS tiene 3 pisos, 16 aulas y 3 laboratorios de cómputo con 15 PCs cada uno. La red actual funciona con switches de 1Gbps sin redundancia y un solo router como gateway central.

### Optimización del rendimiento (VLANs):

● Separar la red lógicamente creando distintas VLANs (una para estudiantes y otra para administración/profesores): Esto evita que la red colapse y reduce las colisiones de datos, ya que el tráfico masivo de los estudiantes no se mezcla con el del personal.

● Implementar enlaces agregados (LACP) entre los switches de los pisos y el switch core: Esto combina varios enlaces físicos en uno solo lógico, aumentando el ancho de banda disponible y permitiendo balanceo de carga.

● Actualizar el backbone a fibra óptica (10Gbps) entre los switches de cada piso y el switch core: Esto elimina el cuello de botella actual de 1Gbps y soporta el tráfico de los 3 laboratorios simultáneos.

### Mejora de la seguridad:

● Configurar los switches de las aulas y pasillos con port security. Si alguien desconecta una PC de la universidad para conectar una laptop personal, el puerto se apagará automáticamente.

● Crear Listas de Control de Acceso (ACL) en el router. Esto permite que los estudiantes tengan acceso a Internet, pero bloquea cualquier intento de entrar a la red de control de estudios, protegiendo así las notas.

### Mejora de la disponibilidad (redundancia):

● Implementar redundancia HA (High Availability) con dos routers en modo activo/pasivo: Si el router principal falla, el secundario toma el control automáticamente sin interrupción del servicio.

● Conectar cada switch de piso al switch core por dos caminos distintos (STP): Si un cable se daña, el tráfico se redirige por el otro camino sin que los usuarios lo noten.

### Monitoreo de red:

● Implementar un servidor de monitoreo (SNMP) que permita ver el estado de todos los switches y routers en tiempo real: Esto permite detectar fallas antes de que los usuarios las reporten.

● Configurar alertas por correo cuando un enlace cae o el uso de CPU de un switch supera el 80%.

### Comparación: red original vs red mejorada

| Aspecto | Red original | Red mejorada |
|---------|-------------|-------------|
| Backbone | 1Gbps cobre | 10Gbps fibra óptica |
| Redundancia | Sin redundancia | HA + STP + LACP |
| Segmentación | Una sola red | VLANs por departamento |
| Seguridad | Sin port security | Port security + ACL |
| Monitoreo | Ninguno | SNMP con alertas |

---

## Datos de acceso

- **URL del simulador:** http://localhost:3000
- **Usuario:** gustavo@silearning.com
- **Contraseña:** Gustavo123!
- **API:** http://localhost:4000
- **Router real:** http://192.168.1.1 (Mercusys AC750)

---

*EVALUACIÓN #5 — ELECTIVA DE ÁREA II — Gustavo.*
