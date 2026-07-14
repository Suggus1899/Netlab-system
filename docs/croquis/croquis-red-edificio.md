# Croquis de Red — Edificio Educativo (3 pisos, 16 aulas, 3 laboratorios)

## Descripción del edificio

- **3 pisos**
- **16 aulas** distribuidas entre los 3 pisos
- **3 laboratorios** de computación (1 por piso), cada uno con **15 computadoras**
- **Total de computadoras en laboratorios:** 45
- **Total de aulas:** 16 (con al menos 1 PC por aula para el docente)

---

## Croquis del edificio (vista lateral)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PISO 3                                       │
│                                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────────┐   │
│  │Aula  │ │Aula  │ │Aula  │ │Aula  │ │Aula  │ │  LABORATORIO 3 │   │
│  │ 3.1  │ │ 3.2  │ │ 3.3  │ │ 3.4  │ │ 3.5  │ │   15 PCs       │   │
│  │(1PC) │ │(1PC) │ │(1PC) │ │(1PC) │ │(1PC) │ │  192.168.30.0  │   │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └───────┬────────┘   │
│     │        │        │        │        │             │             │
│     └────────┴────────┴───┬────┴────────┘             │             │
│                           │                           │             │
│                    [Switch Acceso]              [Switch Acceso]     │
│                    Aulas Piso 3                 Lab 3              │
│                    192.168.3.0/24               192.168.30.0/24    │
│                           │                           │             │
│                     [Switch Distrib.]                   │           │
│                     Piso 3: 192.168.3.1                │           │
└───────────────────────────┼───────────────────────────┼─────────────┘
                            │                           │
┌───────────────────────────┼───────────────────────────┼─────────────┐
│                        PISO 2                                       │
│                           │                           │             │
│                    [Switch Distrib.]                   │             │
│                     Piso 2: 192.168.2.1                │             │
│                           │                           │             │
│     ┌─────────────────────┘                           │             │
│     │        ┌────────────────────────────────────────┘             │
│     │        │                                                       │
│  ┌──┴───┐ ┌──┴───┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────────┐   │
│  │Aula  │ │Aula  │ │Aula  │ │Aula  │ │Aula  │ │  LABORATORIO 2 │   │
│  │ 2.1  │ │ 2.2  │ │ 2.3  │ │ 2.4  │ │ 2.5  │ │   15 PCs       │   │
│  │(1PC) │ │(1PC) │ │(1PC) │ │(1PC) │ │(1PC) │ │  192.168.20.0  │   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └────────────────┘   │
│                                                                     │
│                    [Switch Acceso]              [Switch Acceso]     │
│                    Aulas Piso 2                 Lab 2              │
│                    192.168.2.0/24               192.168.20.0/24    │
└───────────────────────────┼───────────────────────────┼─────────────┘
                            │                           │
┌───────────────────────────┼───────────────────────────┼─────────────┐
│                        PISO 1                                       │
│                           │                           │             │
│                    [Switch Distrib.]                   │             │
│                     Piso 1: 192.168.1.1                │             │
│                           │                           │             │
│     ┌─────────────────────┘                           │             │
│     │        ┌────────────────────────────────────────┘             │
│     │        │                                                       │
│  ┌──┴───┐ ┌──┴───┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐ ┌────────────┐  │
│  │Aula  │ │Aula  │ │Aula  │ │Aula  │ │Aula  │ │  │ │LABORATORIO1│  │
│  │ 1.1  │ │ 1.2  │ │ 1.3  │ │ 1.4  │ │ 1.5  │ │  │ │  15 PCs    │  │
│  │(1PC) │ │(1PC) │ │(1PC) │ │(1PC) │ │(1PC) │ │A │ │192.168.10.0│  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │u │ └─────┬──────┘  │
│  ┌──────┐ ┌──────┐                              │l │       │        │
│  │Aula  │ │Aula  │  (Aula 1.6 = 16 aulas total) │a │       │        │
│  │ 1.6  │ │Recep.│                              │  │       │        │
│  └──────┘ └──────┘                              └──┘       │        │
│                    [Switch Acceso]              [Switch Acceso]    │
│                    Aulas Piso 1                 Lab 1             │
│                    192.168.1.0/24               192.168.10.0/24   │
└───────────────────────────┼───────────────────────────┼───────────┘
                            │                           │
                    ┌───────┴───────────────────────────┘
                    │
              [FIREWALL]
              WAN: 10.0.0.2
              LAN: 172.16.0.1
                    │
              [ROUTER ISP]
              10.0.0.1
                    │
               ┌────┴────┐
               │ INTERNET│
               └─────────┘

    [SERVIDORES — Red 10.0.0.0/24, detrás del firewall]
    ┌──────────────────┐  ┌──────────────────┐
    │ Servidor DHCP/DNS│  │ Servidor Archivos│
    │   10.0.0.10      │  │   10.0.0.20      │
    └──────────────────┘  └──────────────────┘
```

---

## Topología lógica (jerárquica de 3 capas)

```
                        INTERNET
                           │
                    [Router ISP]
                    10.0.0.1
                           │
                    [Firewall]
                    WAN: 10.0.0.2
                    LAN: 172.16.0.1
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
  192.168.1.0  192.168.10.0   192.168.2.0  192.168.20.0
     │              │            │              │
   6 PCs         15 PCs        5 PCs         15 PCs
   (aulas)      (lab)         (aulas)        (lab)


  [Sw Acceso]  [Sw Acceso]
   Aulas P3     Lab 3
  192.168.3.0  192.168.30.0
     │              │
   5 PCs         15 PCs
   (aulas)      (lab)

  [Servidores]  (red separada 10.0.0.0/24)
   DHCP/DNS: 10.0.0.10
   Archivos: 10.0.0.20
```

---

## Esquema de direccionamiento IP

| Zona              | Subred           | Gateway       | Dispositivos              |
|-------------------|------------------|---------------|---------------------------|
| Servidores        | 10.0.0.0/24      | 10.0.0.1      | DHCP/DNS, Archivos        |
| Piso 1 — Aulas    | 192.168.1.0/24   | 192.168.1.1   | 6 PCs (aulas 1.1–1.6)     |
| Piso 1 — Lab 1    | 192.168.10.0/24  | 192.168.10.1  | 15 PCs (.10–.24)          |
| Piso 2 — Aulas    | 192.168.2.0/24   | 192.168.2.1   | 5 PCs (aulas 2.1–2.5)     |
| Piso 2 — Lab 2    | 192.168.20.0/24  | 192.168.20.1  | 15 PCs (.10–.24)          |
| Piso 3 — Aulas    | 192.168.3.0/24   | 192.168.3.1   | 5 PCs (aulas 3.1–3.5)     |
| Piso 3 — Lab 3    | 192.168.30.0/24  | 192.168.30.1  | 15 PCs (.10–.24)          |

### Distribución de aulas por piso (16 total)

| Piso  | Aulas              | Cantidad |
|-------|--------------------|-----------|
| Piso 1| Aula 1.1 a 1.6     | 6 aulas   |
| Piso 2| Aula 2.1 a 2.5     | 5 aulas   |
| Piso 3| Aula 3.1 a 3.5     | 5 aulas   |
| **Total** |                | **16 aulas** |

---

## Lista completa de dispositivos

### Capa Core (1 dispositivo)
| Dispositivo     | IP           | Función                          |
|-----------------|--------------|----------------------------------|
| Router ISP      | 10.0.0.1     | Gateway a Internet               |

### Capa Seguridad (1 dispositivo)
| Dispositivo     | IP                          | Función                          |
|-----------------|-----------------------------|----------------------------------|
| Firewall        | WAN: 10.0.0.2 / LAN: 172.16.0.1 | Filtrado de tráfico entre zonas |

### Capa Distribución (3 dispositivos)
| Dispositivo           | IP           | Función                          |
|-----------------------|--------------|----------------------------------|
| Switch Distrib. Piso 1| 192.168.1.1  | Concentrador del Piso 1          |
| Switch Distrib. Piso 2| 192.168.2.1  | Concentrador del Piso 2          |
| Switch Distrib. Piso 3| 192.168.3.1  | Concentrador del Piso 3          |

### Capa Acceso (6 dispositivos)
| Dispositivo           | Subred           | Función                          |
|-----------------------|------------------|----------------------------------|
| Switch Acceso Aulas P1| 192.168.1.0/24   | Conecta PCs de aulas del Piso 1  |
| Switch Acceso Lab 1   | 192.168.10.0/24  | Conecta 15 PCs del Laboratorio 1 |
| Switch Acceso Aulas P2| 192.168.2.0/24   | Conecta PCs de aulas del Piso 2  |
| Switch Acceso Lab 2   | 192.168.20.0/24  | Conecta 15 PCs del Laboratorio 2 |
| Switch Acceso Aulas P3| 192.168.3.0/24   | Conecta PCs de aulas del Piso 3  |
| Switch Acceso Lab 3   | 192.168.30.0/24  | Conecta 15 PCs del Laboratorio 3 |

### Servidores (2 dispositivos)
| Dispositivo         | IP         | Función                          |
|---------------------|------------|----------------------------------|
| Servidor DHCP/DNS   | 10.0.0.10  | Asignación IP automática + DNS   |
| Servidor de Archivos| 10.0.0.20  | Almacenamiento compartido        |

### Computadoras (61 total)
| Zona              | Cantidad | Rango IP                        |
|-------------------|----------|---------------------------------|
| Lab 1 (Piso 1)    | 15 PCs   | 192.168.10.10 – 192.168.10.24   |
| Lab 2 (Piso 2)    | 15 PCs   | 192.168.20.10 – 192.168.20.24   |
| Lab 3 (Piso 3)    | 15 PCs   | 192.168.30.10 – 192.168.30.24   |
| Aulas Piso 1      | 6 PCs    | 192.168.1.10 – 192.168.1.15     |
| Aulas Piso 2      | 5 PCs    | 192.168.2.10 – 192.168.2.14     |
| Aulas Piso 3      | 5 PCs    | 192.168.3.10 – 192.168.3.14     |
| **Total**         | **61 PCs** |                               |

### Resumen de dispositivos
| Tipo       | Cantidad |
|------------|----------|
| Routers    | 1        |
| Firewalls  | 1        |
| Switches   | 9 (3 distribución + 6 acceso) |
| Servidores | 2        |
| PCs        | 61       |
| **Total**  | **74 dispositivos** |

---

## Representación en el simulador

El simulador tiene un límite de 20 dispositivos. Para representar esta red en el canvas, se usa una **topología simplificada** con los dispositivos clave:

| Dispositivo en canvas        | Representa                          |
|------------------------------|-------------------------------------|
| Router ISP                   | Router principal                    |
| Firewall                     | Firewall de borde                   |
| Switch Dist. Piso 1          | Switch de distribución del Piso 1   |
| Switch Dist. Piso 2          | Switch de distribución del Piso 2   |
| Switch Dist. Piso 3          | Switch de distribución del Piso 3   |
| Servidor DHCP/DNS            | Servidor de servicios               |
| PC Lab 1 (representativo)    | Las 15 PCs del Laboratorio 1        |
| PC Lab 2 (representativo)    | Las 15 PCs del Laboratorio 2        |
| PC Lab 3 (representativo)    | Las 15 PCs del Laboratorio 3        |
| PC Aula (representativo)     | Las PCs de las aulas                |

El croquis completo con los 74 dispositivos se documenta externamente (este documento).
