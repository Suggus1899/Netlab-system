# Guion — Gustavo: Puntos 1, 3 y 2 (menos de 4 minutos)

**Guion rápido para grabar — Simulador + Router real Mercusys AC750**

---

## Acceso

1. http://localhost:3000
2. Usuario: gustavo@silearning.com | Contraseña: Gustavo123!
3. Laboratorios → Práctica 1

---

## PUNTO 1 — Diseño de red (0:00 - 1:00)

### Enunciado
> Deben crear una red, pueden utilizar algún simulador o hacer un dibujo con todos los dispositivos de red (PC, switch, router) y en la leyenda deben colocar las IP de cada equipo.

### Guion (decir en cámara)

> "Diseñamos una red para un laboratorio de cómputo usando un router Mercusys AC750. La tenemos guardada en un archivo JSON que vamos a importar al simulador."

### Acciones (mostrar en pantalla)

1. **Clic en Importar** en el simulador → seleccionar **docs/redes/red-gustavo.json**
2. **Mostrar el canvas** con la red ya cargada (3 PCs, switch, router Mercusys AC750, cables)
3. **Mostrar la leyenda de IPs** (tenerla abierta o en pantalla):

| Dispositivo | IP | Máscara | Gateway | DNS |
|-------------|-----|---------|---------|-----|
| PC1 | 192.168.1.10 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 |
| PC2 | 192.168.1.20 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 |
| PC3 | 192.168.1.30 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 |
| Mercusys AC750 | 192.168.1.1 | 255.255.255.0 | — | — |

4. **Ping rápido** desde PC1 hacia PC2:
   - Clic en **PC1** en el canvas para seleccionarlo
   - En la barra superior, el dropdown de protocolo ya dice **"ICMP Ping"**
   - Clic en **Simular**
   - En el diálogo, escribe la IP destino **192.168.1.20** (o clic en el botón "PC2: 192.168.1.20")
   - Clic en **Ejecutar**
   - El paquete viaja de PC1 → switch → PC2 → EXITOSO

> "Como pueden ver, la red funciona. Los PCs se comunican entre sí a través del switch y el router Mercusys."

**[1:00] Fin Punto 1.**

---

## PUNTO 3 — Resolución de problemas (1:00 - 2:30)

### Enunciado
> Usando el ejemplo de la 1ra pregunta, pueden plantearse algún fallo que se pueda presentar en esa red y cómo solucionarlo, desde cómo detectar fallas con software y herramientas, y luego cómo se soluciona.

### Guion (decir en cámara)

> "Ahora vamos a plantear una falla en esta red. Vamos a desconectar el cable de PC2 y veremos cómo detectarla y solucionarla."

### Acciones

1. **Introducir la falla:** Eliminar el cable entre el switch y PC2
   - Clic en el **cable** que conecta PC2 con el switch (la línea entre ellos)
   - Clic en el botón **Eliminar** (ícono de papelera en la barra superior)
   - El cable desaparece → PC2 queda desconectado

2. **Detectar la falla:**
   - Clic en **PC1** → seleccionar protocolo **"ICMP Ping"** → **Simular**
   - IP destino: **192.168.1.20** (PC2) → **Ejecutar** → **FALLA** (no llega a PC2)
   - Clic en **PC1** → **Simular** → IP destino: **192.168.1.30** (PC3) → **Ejecutar** → **FUNCIONA**
   - Clic en **PC1** → **Simular** → IP destino: **192.168.1.1** (router) → **Ejecutar** → **FUNCIONA**

> "El ping a PC2 falla, pero el ping a PC3 y al router funcionan. Esto nos dice que la red general está bien y el problema es específico de PC2. Revisamos los cables y vemos que el cable de PC2 está desconectado."

3. **Solucionar la falla:** Reconectar el cable de PC2 al switch
   - Arrastrar desde una interfaz de **PC2** hacia un puerto libre del **switch**
   - Se crea el cable automáticamente
   - Clic en **PC1** → **Simular** → IP destino: **192.168.1.20** → **Ejecutar** → **EXITOSO**

> "Reconectamos el cable y el ping vuelve a funcionar. Falla solucionada."

**[2:30] Fin Punto 3.**

---

## PUNTO 2 — Configuración del Router Mercusys AC750 (2:30 - 3:50)

### Enunciado
> Se debe configurar y administrar el Router con la siguiente IP: 192.168.1.1, incluyendo el filtrado MAC.

### Guion (decir en cámara)

> "Ahora vamos a configurar el router real. Este es un router Mercusys AC750 con la IP 192.168.1.1. Vamos a aplicar filtrado MAC desde la interfaz web del router para controlar qué dispositivos pueden acceder a la red."

### Acciones (grabar la interfaz web real del router)

1. **Abrir el navegador** en **http://192.168.1.1**
2. **Iniciar sesión** con las credenciales del router
3. **Ir a Advanced → Network Control → Access Control**

4. **Activar Access Control** (toggle on)

5. **Seleccionar modo:**
   - Elegir **Blacklist** (bloquear dispositivos específicos)

6. **Agregar regla MAC para bloquear tu PC:**
   - Add → descripción: "Mi PC" → MAC: **70-85-C2-72-8D-70** → Configure → Save

7. **Verificar el bloqueo:**
   - Desde tu PC → ping a 192.168.1.1 → **FALLA** (MAC bloqueada)
   - O intentar navegar → **sin internet**

> "Como pueden ver, al agregar la MAC de mi PC a la blacklist, el router bloquea el acceso. Mi PC perdió conectividad porque el filtrado MAC le impide pasar por el router."

8. **Quitar la regla para restaurar acceso:**
   - Eliminar la regla de la blacklist
   - Ping desde tu PC → 192.168.1.1 → **EXITOSO**
   - Navegación restaurada

> "Quitamos la regla y el acceso se restablece. Esto demuestra cómo el filtrado MAC controla qué dispositivos pueden acceder a la red basándose en su dirección física."

**[3:50] Fin del video.**

---

## Resumen de tiempos

| Punto | Tiempo | Dónde se graba | Acción principal |
|-------|--------|----------------|------------------|
| 1. Diseño | 0:00 - 1:00 | Simulador | Importar JSON + leyenda de IPs + ping |
| 3. Fallas | 1:00 - 2:30 | Simulador | 1 falla (cable desconectado) + detectar + solucionar |
| 2. Router | 2:30 - 3:50 | Router real (http://192.168.1.1) | Access Control + filtrado MAC whitelist |
| Cierre | 3:50 - 4:00 | — | "Eso es todo, gracias" |

**Total: menos de 4 minutos.**

---

## Lo que decir en cada punto (frases clave)

### Punto 1 (decir rápido)
> "Diseñamos esta red: 3 PCs, un switch y un router Mercusys AC750, subred 192.168.1.0/24. La importamos desde un archivo JSON y aquí está en el simulador. En la leyenda están las IPs de cada equipo. Hacemos un ping y verificamos que funciona."

### Punto 3 (decir rápido)
> "Plantemos una falla: desconectamos el cable de PC2. Detectamos con ping: PC2 no responde pero PC3 y el router sí. El problema es específico de PC2. Revisamos los cables: el de PC2 está desconectado. Lo reconectamos y el ping vuelve a funcionar."

### Punto 2 (decir rápido)
> "Ahora configuramos el router Mercusys real. Entramos a http://192.168.1.1, vamos a Access Control, activamos la blacklist y agregamos la MAC de mi PC: 70-85-C2-72-8D-70. Verificamos: mi PC pierde internet. Quitamos la regla y el acceso se restablece. Esto es el filtrado MAC."

---

## Notas técnicas

- **Router:** Mercusys AC750 (MR20)
- **IP del router:** 192.168.1.1
- **Subred:** 192.168.1.0/24
- **PC real (Gustavo):** IP 192.168.1.110, MAC 70-85-C2-72-8D-70
- **Ruta del filtrado MAC:** Advanced → Network Control → Access Control → MAC Address mode
- **Modo:** Blacklist (bloquear tu PC, más seguro para la demo)
- **Formato MAC en Mercusys:** XX-XX-XX-XX-XX-XX (con guiones)

### Antes de grabar
- [ ] Tener acceso a la interfaz web del router (http://192.168.1.1)
- [ ] Tener el archivo **docs/redes/red-gustavo.json** accesible
- [ ] Simulador corriendo en http://localhost:3000
- [ ] Verificar que tu PC tiene internet (ping a 192.168.1.1 funciona)
- [ ] **OJO:** al bloquear tu MAC en el router, perderás internet temporalmente. Ten otra forma de acceder al router (teléfono conectado al WiFi) para quitar la regla si algo falla.

---

*Guion para grabar los puntos 1, 3 y 2 — menos de 4 minutos — Gustavo — Router real Mercusys AC750.*
