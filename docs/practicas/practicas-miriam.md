# Prácticas de Redes — Miriam

**Estudiante:** Miriam
**Curso:** Prácticas de Redes — Miriam
**Plataforma:** SI Learning Red (simulador interactivo)
**Acceso:** http://localhost:3000/login
**Usuario:** miriam@silearning.com
**Contraseña:** Miriam123!

---

## Índice

1. [Práctica 1: Diseño de red y resolución de problemas](#práctica-1-diseño-de-red-y-resolución-de-problemas)
2. [Práctica 2: Proyecto de mejora de red — Edificio AIS](#práctica-2-proyecto-de-mejora-de-red--edificio-ais)

---

## Práctica 1: Diseño de red y resolución de problemas

### Descripción

Diseñar una red LAN desde cero para una oficina pequeña (2 PCs, switch, router), configurar las direcciones IP, verificar conectividad y luego introducir fallas deliberadas para diagnosticarlas y resolverlas.

Deben crear una red, pueden utilizar algún simulador o hacer un dibujo a mano con todos los dispositivos de red (PC, switch, router) y en la leyenda deben colocar las IP de cada equipo.

### Escenario

Oficina pequeña con 2 computadoras conectadas mediante un switch y un router para acceso a Internet.

**Subred:** 192.168.1.0/24

### Parte 1 — Diseño

#### Dispositivos necesarios

| Dispositivo | Cantidad | Función |
|-------------|----------|---------|
| PC | 2 | Equipos finales de la oficina |
| Switch | 1 | Punto central de conexión |
| Router | 1 | Gateway hacia Internet |

#### Esquema de direccionamiento IP

| Dispositivo | IP | Máscara | Gateway |
|-------------|-----|---------|---------|
| PC1 | 192.168.1.10 | 255.255.255.0 | 192.168.1.1 |
| PC2 | 192.168.1.20 | 255.255.255.0 | 192.168.1.1 |
| Router | 192.168.1.1 | 255.255.255.0 | — |

#### Pasos del diseño

1. Colocar 2 PCs, 1 switch y 1 router en el canvas.
2. Conectar cada PC al switch y el switch al router.
3. Configurar las IPs según la tabla anterior.
4. Verificar conectividad con ping (PC1 → PC2 y PC1 → router).

#### Croquis de la red

```
    PC1                    PC2
  192.168.1.10          192.168.1.20
  255.255.255.0         255.255.255.0
  GW: 192.168.1.1       GW: 192.168.1.1
       |                     |
       |                     |
       +--------+------------+
                |
            [SWITCH]
                |
           [ROUTER]
          192.168.1.1
          255.255.255.0
                |
            [INTERNET]
```

**Leyenda de IPs:**

| Dispositivo | IP | Máscara | Gateway |
|-------------|-----|---------|---------|
| PC1 | 192.168.1.10 | 255.255.255.0 | 192.168.1.1 |
| PC2 | 192.168.1.20 | 255.255.255.0 | 192.168.1.1 |
| Switch | — | — | — |
| Router | 192.168.1.1 | 255.255.255.0 | — |

### Parte 2 — Resolución de problemas

Una vez que la red funciona, introduces **2 fallas deliberadas** y las diagnosticas.

#### Falla 1: IP en subred equivocada

**Qué hacer:** Cambiar la IP de PC2 de 192.168.1.20 a 192.168.2.20 (subred equivocada).

**Diagnóstico:**
- Ping desde PC1 (192.168.1.10) hacia PC2 (192.168.2.20) → FALLA
- Revisar IP de PC2 con `ipconfig` → está en 192.168.2.0/24, subred diferente
- Causa raíz: PC2 está en otra subred y no puede comunicarse con PC1 ni el router

**Solución:** Corregir la IP de PC2 a 192.168.1.20. Verificar con ping.

#### Falla 2: Gateway incorrecto

**Qué hacer:** Cambiar el gateway de PC1 de 192.168.1.1 a 192.168.2.1 (gateway inexistente).

**Diagnóstico:**
- Ping desde PC1 hacia PC2 (192.168.1.20) → FUNCIONA (misma subred, no usa gateway)
- Ping desde PC1 hacia el router (192.168.1.1) → FALLA (necesita gateway correcto)
- Revisar configuración de PC1 → gateway apunta a 192.168.2.1 que no existe
- Causa raíz: el gateway de PC1 apunta a un router inexistente

**Solución:** Corregir el gateway de PC1 a 192.168.1.1. Verificar con ping al router.

#### Herramientas de diagnóstico

| Herramienta | Función | Comando |
|-------------|---------|---------|
| Ping | Verificar conectividad | `ping 192.168.1.20` |
| ipconfig | Ver configuración IP | `ipconfig` |
| ARP | Tabla MAC/IP | `arp -a` |

### Entregables

- [ ] Red diseñada en el simulador (2 PCs, switch, router)
- [ ] Dibujo de la red con leyenda de IPs
- [ ] Ping verificado entre PCs y hacia el router
- [ ] Falla 1 diagnosticada y resuelta
- [ ] Falla 2 diagnosticada y resuelta
- [ ] Documentación de cada falla (síntoma, diagnóstico, causa, solución)

---

## Práctica 2: Proyecto de mejora de red — Edificio AIS

### Descripción

Estudiar y analizar el proyecto de red macro del edificio de AIS (3 pisos, 16 aulas, 3 laboratorios de 15 PCs cada uno) y proponer mejoras enfocadas en **VLANs**, **segmentación de seguridad** y **WiFi**.

### Contexto del edificio AIS

- **3 pisos**
- **16 aulas** (6 en Piso 1, 5 en Piso 2, 5 en Piso 3)
- **3 laboratorios** (1 por piso), cada uno con **15 computadoras** (45 PCs total)
- Cada aula tiene al menos 1 PC para el docente
- **Total:** ~74 dispositivos

### Red actual (antes de la mejora)

```
                        INTERNET
                           │
                    [Router ISP] 10.0.0.1
                           │
                    [Firewall] WAN: 10.0.0.2 / LAN: 172.16.0.1
                           │
              ┌────────────┼────────────┐
              │            │            │
        [Switch Dist.] [Switch Dist.] [Switch Dist.]
         Piso 1          Piso 2          Piso 3
        192.168.1.1     192.168.2.1     192.168.3.1
          │    │          │    │          │    │
     ┌────┘    └────┐  ┌──┘    └────┐  ┌──┘    └────┐
     │              │  │            │  │            │
  [Sw Acceso]  [Sw Acceso]     [Sw Acceso]  [Sw Acceso]
   Aulas P1     Lab 1          Aulas P2     Lab 2
     │              │            │              │
   6 PCs         15 PCs        5 PCs         15 PCs

  [Sw Acceso]  [Sw Acceso]
   Aulas P3     Lab 3
     │              │
   5 PCs         15 PCs

  [Servidores] 10.0.0.0/24
   DHCP/DNS: 10.0.0.10
   Archivos: 10.0.0.20
```

**Problemas identificados:**
- 9 switches físicos (3 distribución + 6 acceso) — excesivo
- Sin segmentación de seguridad por zonas
- Sin WiFi en aulas

### Mejoras propuestas

#### 1. VLANs para reducir switches físicos

Reemplazar las 7 subredes físicas separadas por VLANs:

| VLAN | Zona | Subred |
|------|------|--------|
| VLAN 10 | Aulas Piso 1 | 192.168.1.0/24 |
| VLAN 20 | Aulas Piso 2 | 192.168.2.0/24 |
| VLAN 30 | Aulas Piso 3 | 192.168.3.0/24 |
| VLAN 100 | Lab 1 | 192.168.10.0/24 |
| VLAN 200 | Lab 2 | 192.168.20.0/24 |
| VLAN 300 | Lab 3 | 192.168.30.0/24 |
| VLAN 999 | Servidores | 10.0.0.0/24 |

**Beneficio:** De 9 switches físicos a 3 switches managed con VLANs.

#### 2. Segmentación de seguridad por zonas

| Zona | VLANs | Descripción |
|------|-------|-------------|
| Internet | — | Tráfico externo (WAN) |
| Académica | 10, 20, 30, 100, 200, 300 | Aulas y laboratorios |
| Administrativa | 500 | Oficinas de profesores |
| Invitados | 600 | WiFi de visitantes |
| Servidores | 999 | DHCP/DNS y archivos |

**Reglas de firewall:**
- Invitados NO pueden acceder a Académica ni Administrativa
- Académica puede acceder a Servidores (DHCP/DNS)
- Administrativa puede acceder a todas las zonas

#### 3. WiFi para aulas

- 2 puntos de acceso por piso (6 total)
- VLAN 600: WiFi de invitados (separada de la red académica)
- VLAN 700: WiFi académico (para docentes y alumnos autorizados)

### Topología mejorada

```
                        INTERNET
                           │
                    [Router ISP] 10.0.0.1
                           │
                    [Firewall] WAN: 10.0.0.2
                      Zonas: Internet, Académica,
                      Administrativa, Invitados, Servidores
                           │
              ┌────────────┼────────────┐
              │            │            │
        [Switch VLAN]  [Switch VLAN]  [Switch VLAN]
         Piso 1          Piso 2          Piso 3
        VLANs 10,100    VLANs 20,200    VLANs 30,300
        + WiFi AP 1,2   + WiFi AP 3,4   + WiFi AP 5,6
           │                │                │
     PCs aulas + Lab 1  PCs aulas + Lab 2  PCs aulas + Lab 3

  [Servidores] VLAN 999 — 10.0.0.0/24
   DHCP/DNS: 10.0.0.10
   Archivos: 10.0.0.20
```

### Pasos del simulador

1. Analizar la red existente.
2. Diseñar el esquema de VLANs.
3. Diseñar la segmentación de seguridad por zonas.
4. Diseñar el WiFi para aulas.
5. Colocar router, firewall, 3 switches, servidor y 3 PCs representativos.
6. Conectar y configurar IPs.
7. Verificar conectividad entre pisos (ping Lab 1 → Lab 2).
8. Elaborar croquis y documentar.

### Entregables

- [ ] Análisis de la red existente
- [ ] Esquema de VLANs documentado
- [ ] Zonas de seguridad con reglas de firewall
- [ ] Diseño del WiFi con ubicación de puntos de acceso
- [ ] Red mejorada en el simulador
- [ ] Croquis del edificio con las mejoras
- [ ] Justificación técnica de cada mejora
- [ ] Comparación: red original (9 switches) vs mejorada (3 switches con VLANs)

---

## Resumen

| Práctica | Enfoque | Entregables |
|----------|---------|-------------|
| 1. Diseño + Resolución de problemas | Oficina pequeña (2 PCs) + 2 fallas | Red + dibujo + diagnóstico de fallas |
| 2. Proyecto de mejora AIS | VLANs + seguridad + WiFi | Análisis + mejoras + croquis + documentación |

---

## Datos de acceso

- **URL:** http://localhost:3000
- **Usuario:** miriam@silearning.com
- **Contraseña:** Miriam123!
- **API:** http://localhost:4000

---

*Documento generado para el curso de Prácticas de Redes — Miriam.*
