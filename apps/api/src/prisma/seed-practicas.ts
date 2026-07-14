import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando usuarios y prácticas...');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const miriamPass = await bcrypt.hash('Miriam123!', 12);
  const miriam = await prisma.user.upsert({
    where: { email: 'miriam@silearning.com' },
    update: {},
    create: {
      email: 'miriam@silearning.com',
      name: 'Miriam',
      password: miriamPass,
      role: 'STUDENT',
    },
  });

  const gustavoPass = await bcrypt.hash('Gustavo123!', 12);
  const gustavo = await prisma.user.upsert({
    where: { email: 'gustavo@silearning.com' },
    update: {},
    create: {
      email: 'gustavo@silearning.com',
      name: 'Gustavo',
      password: gustavoPass,
      role: 'STUDENT',
    },
  });

  console.log(`   ✓ Miriam:   ${miriam.email}`);
  console.log(`   ✓ Gustavo:  ${gustavo.email}`);

  const teacher = await prisma.user.findUnique({
    where: { email: 'profesor@silearning.com' },
  });
  if (!teacher) throw new Error('El usuario profesor@silearning.com no existe. Ejecuta el seed principal primero.');

  // ── Cursos separados (uno por estudiante) ─────────────────────────────────
  const cursoMiriam = await prisma.course.upsert({
    where: { id: 'c-miriam' },
    update: {},
    create: {
      id: 'c-miriam',
      name: 'Prácticas de Redes — Miriam',
      description: 'Diseño de red + resolución de problemas y proyecto de mejora del edificio AIS.',
      teacherId: teacher.id,
    },
  });

  const cursoGustavo = await prisma.course.upsert({
    where: { id: 'c-gustavo' },
    update: {},
    create: {
      id: 'c-gustavo',
      name: 'Prácticas de Redes — Gustavo',
      description: 'Diseño de red + resolución de problemas y proyecto de mejora del edificio AIS.',
      teacherId: teacher.id,
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: miriam.id, courseId: cursoMiriam.id } },
    update: {},
    create: { userId: miriam.id, courseId: cursoMiriam.id },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: gustavo.id, courseId: cursoGustavo.id } },
    update: {},
    create: { userId: gustavo.id, courseId: cursoGustavo.id },
  });
  console.log(`   ✓ Curso Miriam: ${cursoMiriam.name}`);
  console.log(`   ✓ Curso Gustavo: ${cursoGustavo.name}`);

  // ══════════════════════════════════════════════════════════════════════════
  // PRÁCTICA 1 — MIRIAM: Diseño + Resolución de problemas
  // Escenario: Red de oficina pequeña (2 PCs, switch, router)
  // Fallas: IP en subred equivocada + gateway incorrecto
  // ══════════════════════════════════════════════════════════════════════════
  const labMiriam1Id = 'lab-miriam-diseno-fallas';
  const labMiriam1 = await prisma.lab.upsert({
    where: { id: labMiriam1Id },
    update: {},
    create: {
      id: labMiriam1Id,
      title: 'Práctica 1: Diseño de red y resolución de problemas',
      description: `Diseñar una red LAN desde cero para una oficina pequeña (2 PCs, switch, router), configurar las direcciones IP, verificar conectividad y luego introducir fallas deliberadas para diagnosticarlas y resolverlas.

Escenario: Oficina con 2 computadoras conectadas mediante un switch y un router para acceso a Internet.

Subred: 192.168.1.0/24

Parte 1 — Diseño:
- Colocar 2 PCs, 1 switch y 1 router
- Conectar todos los dispositivos
- Configurar IPs: PC1 192.168.1.10, PC2 192.168.1.20, router 192.168.1.1
- Verificar conectividad con ping

Parte 2 — Resolución de problemas:
- Introducir 2 fallas deliberadas en la red
- Diagnosticar cada falla con herramientas (ping, ARP, ipconfig)
- Aplicar la solución y restaurar la conectividad

Deben crear una red, pueden utilizar algún simulador o hacer un dibujo a mano con todos los dispositivos de red (PC, switch, router) y en la leyenda deben colocar las IP de cada equipo.`,
      difficulty: 'BEGINNER',
      topic: 'Diseño de Redes',
      status: 'PUBLISHED',
      estimatedMinutes: 60,
      creatorId: teacher.id,
      topologyData: { devices: [], links: [] },
    },
  });

  const labMiriam1Steps = [
    {
      order: 1,
      title: 'Leer los requisitos y planificar el diseño',
      instructions: `Vas a diseñar una red para una oficina pequeña con:
- 2 computadoras (PCs)
- 1 switch central
- 1 router para acceso a Internet

Subred: 192.168.1.0/24

Planifica antes de construir:
- PC1: IP 192.168.1.10, máscara 255.255.255.0, gateway 192.168.1.1
- PC2: IP 192.168.1.20, máscara 255.255.255.0, gateway 192.168.1.1
- Router: IP 192.168.1.1, máscara 255.255.255.0

Dibuja un esquema preliminar con los dispositivos y sus IPs.`,
      hint: 'Todos los dispositivos deben estar en la misma subred (192.168.1.0/24) para comunicarse.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 2,
      title: 'Colocar al menos 2 PCs en el canvas',
      instructions: 'Agrega al menos 2 computadoras (PC) al canvas. Estos serán los equipos finales de la oficina.',
      hint: 'Usa el panel de dispositivos para arrastrar PCs al canvas.',
      validation: { type: 'device_count', expected: { deviceType: 'PC', minCount: 2 } },
    },
    {
      order: 3,
      title: 'Colocar al menos 1 switch en el canvas',
      instructions: 'Agrega al menos 1 switch al canvas. El switch será el punto central de conexión.',
      hint: 'El switch permite conectar múltiples dispositivos en la misma red local.',
      validation: { type: 'device_count', expected: { deviceType: 'SWITCH', minCount: 1 } },
    },
    {
      order: 4,
      title: 'Colocar al menos 1 router en el canvas',
      instructions: 'Agrega un router al canvas. Este router será el gateway de la red hacia Internet.',
      hint: 'El router se conecta al switch y provee el gateway para los PCs.',
      validation: { type: 'device_count', expected: { deviceType: 'ROUTER', minCount: 1 } },
    },
    {
      order: 5,
      title: 'Conectar todos los dispositivos',
      instructions: 'Conecta cada PC a un puerto del switch y el switch al router usando cables de red.',
      hint: 'Haz clic en una interfaz de un dispositivo y luego en una interfaz del switch para crear un enlace.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 6,
      title: 'Configurar las direcciones IP',
      instructions: `Configura las siguientes direcciones IP:

PC1: IP 192.168.1.10, máscara 255.255.255.0, gateway 192.168.1.1
PC2: IP 192.168.1.20, máscara 255.255.255.0, gateway 192.168.1.1
Router: IP 192.168.1.1, máscara 255.255.255.0

Recuerda: todos deben estar en la misma subred (192.168.1.0/24).`,
      hint: 'Haz clic en cada dispositivo para abrir su configuración y asignar la IP a su interfaz.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 7,
      title: 'Verificar conectividad inicial',
      instructions: 'Verifica que los PCs puedan comunicarse. Usa ping desde PC1 (192.168.1.10) hacia PC2 (192.168.1.20) y hacia el router (192.168.1.1). Ambos pings deben ser exitosos.',
      hint: 'Si el ping falla, revisa que ambos PCs tengan IPs en la misma subred y que estén conectados al switch.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.1.10', targetIp: '192.168.1.20', connected: true } },
    },
    {
      order: 8,
      title: 'FALLA 1: Introducir IP en subred equivocada',
      instructions: `Introduce deliberadamente una falla: cambia la IP de PC2 de 192.168.1.20 a 192.168.2.20 (subred equivocada).

Esto simula un error de configuración común donde un equipo se configura en la subred incorrecta.

NO corrijas el error todavía. Primero diagnostícalo.`,
      hint: 'Esta falla hace que PC2 esté en una subred diferente (192.168.2.0/24) y no pueda comunicarse con PC1 ni el router.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 9,
      title: 'FALLA 1: Diagnosticar la falla',
      instructions: `Diagnostica la falla introducida:

1. Haz ping desde PC1 (192.168.1.10) hacia PC2 (192.168.2.20) — debe FALLAR
2. Revisa la configuración IP de PC2 (ipconfig o ifconfig)
3. Identifica que PC2 tiene IP 192.168.2.20 que está en otra subred (192.168.2.0/24)
4. Documenta: ¿Qué síntoma observaste? ¿Qué herramienta usaste? ¿Cuál es la causa raíz?`,
      hint: 'El ping falla porque PC2 está en 192.168.2.0/24 y PC1 en 192.168.1.0/24. Están en subredes diferentes sin un router que las interconecte correctamente.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 10,
      title: 'FALLA 1: Corregir la falla',
      instructions: 'Corrige la falla: cambia la IP de PC2 de vuelta a 192.168.1.20, máscara 255.255.255.0, gateway 192.168.1.1. Verifica con ping desde PC1 que la conectividad se restauró.',
      hint: 'Después de corregir, el ping desde PC1 (192.168.1.10) hacia PC2 (192.168.1.20) debe ser exitoso.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.1.10', targetIp: '192.168.1.20', connected: true } },
    },
    {
      order: 11,
      title: 'FALLA 2: Introducir gateway incorrecto',
      instructions: `Introduce deliberadamente una segunda falla: cambia el gateway de PC1 de 192.168.1.1 a 192.168.2.1 (gateway inexistente).

Esto simula un error donde el gateway apunta a una IP que no existe en la red.

NO corrijas el error todavía. Primero diagnostícalo.`,
      hint: 'Esta falla hace que PC1 no pueda enviar tráfico fuera de su subred porque su gateway apunta a un router inexistente.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 12,
      title: 'FALLA 2: Diagnosticar la falla',
      instructions: `Diagnostica la segunda falla:

1. Haz ping desde PC1 hacia PC2 (192.168.1.20) — debe FUNCIONAR (misma subred, no necesita gateway)
2. Haz ping desde PC1 hacia el router (192.168.1.1) — debe FALLAR (necesita gateway correcto)
3. Revisa la configuración de PC1 (ipconfig)
4. Identifica que el gateway de PC1 es 192.168.2.1 que no existe
5. Documenta: ¿Por qué el ping a PC2 funciona pero al router no? ¿Cuál es la causa raíz?`,
      hint: 'El ping a PC2 funciona porque están en la misma subred (no necesita gateway). El ping al router falla porque el gateway de PC1 (192.168.2.1) no existe, y el tráfico que sale de la subred se envía al gateway.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
    {
      order: 13,
      title: 'FALLA 2: Corregir la falla',
      instructions: 'Corrige la falla: cambia el gateway de PC1 de vuelta a 192.168.1.1. Verifica con ping desde PC1 hacia el router (192.168.1.1) que la conectividad se restauró.',
      hint: 'Después de corregir, el ping desde PC1 hacia el router (192.168.1.1) debe ser exitoso.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.1.10', targetIp: '192.168.1.1', connected: true } },
    },
    {
      order: 14,
      title: 'Documentar la red con leyenda de IPs',
      instructions: `Documenta tu red completa. Crea un diagrama (a mano o con herramienta) que incluya:
- Todos los dispositivos: PCs, switch, router
- La leyenda con las direcciones IP de cada equipo
- Las conexiones entre dispositivos
- La subred utilizada (192.168.1.0/24)
- Documenta también las 2 fallas que introduciste: síntoma, diagnóstico, causa y solución

La documentación debe entregarse al profesor junto con el simulador completado.`,
      hint: 'La leyenda debe mostrar: nombre del dispositivo, dirección IP, máscara de subred y gateway. Para cada falla documenta: qué falló, cómo lo diagnosticaste, y cómo lo resolviste.',
      validation: { type: 'observation', labId: labMiriam1Id },
    },
  ];

  for (const s of labMiriam1Steps) {
    await prisma.labStep.upsert({
      where: { labId_order: { labId: labMiriam1.id, order: s.order } },
      update: {},
      create: { labId: labMiriam1.id, ...s },
    });
  }
  console.log(`   ✓ Miriam - Práctica 1: ${labMiriam1.title} (${labMiriam1Steps.length} pasos)`);

  await prisma.labAssignment.upsert({
    where: { labId_courseId: { labId: labMiriam1.id, courseId: cursoMiriam.id } },
    update: {},
    create: { labId: labMiriam1.id, courseId: cursoMiriam.id },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRÁCTICA 1 — GUSTAVO: Diseño + Resolución de problemas
  // Escenario: Laboratorio de cómputo (3 PCs, switch, router)
  // Fallas: Cable desconectado + interfaz del router apagada
  // ══════════════════════════════════════════════════════════════════════════
  const labGustavo1Id = 'lab-gustavo-diseno-fallas';
  const labGustavo1 = await prisma.lab.upsert({
    where: { id: labGustavo1Id },
    update: {},
    create: {
      id: labGustavo1Id,
      title: 'Práctica 1: Diseño de red y resolución de problemas',
      description: `Diseñar una red LAN desde cero para un laboratorio de cómputo (3 PCs, switch, router), configurar las direcciones IP, verificar conectividad y luego introducir fallas deliberadas para diagnosticarlas y resolverlas.

Escenario: Laboratorio de cómputo con 3 computadoras conectadas mediante un switch y un router para acceso a Internet.

Subred: 192.168.10.0/24

Parte 1 — Diseño:
- Colocar 3 PCs, 1 switch y 1 router
- Conectar todos los dispositivos
- Configurar IPs: PC1 192.168.10.10, PC2 192.168.10.20, PC3 192.168.10.30, router 192.168.10.1
- Verificar conectividad con ping

Parte 2 — Resolución de problemas:
- Introducir 2 fallas deliberadas en la red
- Diagnosticar cada falla con herramientas (ping, ARP, ipconfig)
- Aplicar la solución y restaurar la conectividad

Deben crear una red, pueden utilizar algún simulador o hacer un dibujo a mano con todos los dispositivos de red (PC, switch, router) y en la leyenda deben colocar las IP de cada equipo.`,
      difficulty: 'BEGINNER',
      topic: 'Diseño de Redes',
      status: 'PUBLISHED',
      estimatedMinutes: 60,
      creatorId: teacher.id,
      topologyData: { devices: [], links: [] },
    },
  });

  const labGustavo1Steps = [
    {
      order: 1,
      title: 'Leer los requisitos y planificar el diseño',
      instructions: `Vas a diseñar una red para un laboratorio de cómputo con:
- 3 computadoras (PCs)
- 1 switch central
- 1 router para acceso a Internet

Subred: 192.168.10.0/24

Planifica antes de construir:
- PC1: IP 192.168.10.10, máscara 255.255.255.0, gateway 192.168.10.1
- PC2: IP 192.168.10.20, máscara 255.255.255.0, gateway 192.168.10.1
- PC3: IP 192.168.10.30, máscara 255.255.255.0, gateway 192.168.10.1
- Router: IP 192.168.10.1, máscara 255.255.255.0

Dibuja un esquema preliminar con los dispositivos y sus IPs.`,
      hint: 'Todos los dispositivos deben estar en la misma subred (192.168.10.0/24) para comunicarse.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 2,
      title: 'Colocar al menos 3 PCs en el canvas',
      instructions: 'Agrega al menos 3 computadoras (PC) al canvas. Estos serán los equipos del laboratorio de cómputo.',
      hint: 'Usa el panel de dispositivos para arrastrar PCs al canvas.',
      validation: { type: 'device_count', expected: { deviceType: 'PC', minCount: 3 } },
    },
    {
      order: 3,
      title: 'Colocar al menos 1 switch en el canvas',
      instructions: 'Agrega al menos 1 switch al canvas. El switch será el punto central de conexión del laboratorio.',
      hint: 'El switch permite conectar múltiples dispositivos en la misma red local.',
      validation: { type: 'device_count', expected: { deviceType: 'SWITCH', minCount: 1 } },
    },
    {
      order: 4,
      title: 'Colocar al menos 1 router en el canvas',
      instructions: 'Agrega un router al canvas. Este router será el gateway del laboratorio hacia Internet. IP del router: 192.168.10.1.',
      hint: 'El router se conecta al switch y provee el gateway para los PCs.',
      validation: { type: 'device_count', expected: { deviceType: 'ROUTER', minCount: 1 } },
    },
    {
      order: 5,
      title: 'Conectar todos los dispositivos',
      instructions: 'Conecta cada PC a un puerto del switch y el switch al router usando cables de red. Asegúrate de que los 3 PCs y el router estén conectados al switch.',
      hint: 'Haz clic en una interfaz de un dispositivo y luego en una interfaz del switch para crear un enlace.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 6,
      title: 'Configurar las direcciones IP',
      instructions: `Configura las siguientes direcciones IP:

PC1: IP 192.168.10.10, máscara 255.255.255.0, gateway 192.168.10.1
PC2: IP 192.168.10.20, máscara 255.255.255.0, gateway 192.168.10.1
PC3: IP 192.168.10.30, máscara 255.255.255.0, gateway 192.168.10.1
Router: IP 192.168.10.1, máscara 255.255.255.0

Recuerda: todos deben estar en la misma subred (192.168.10.0/24).`,
      hint: 'Haz clic en cada dispositivo para abrir su configuración y asignar la IP a su interfaz.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 7,
      title: 'Verificar conectividad inicial',
      instructions: 'Verifica que los PCs puedan comunicarse. Usa ping desde PC1 (192.168.10.10) hacia PC2 (192.168.10.20) y hacia el router (192.168.10.1). Ambos pings deben ser exitosos.',
      hint: 'Si el ping falla, revisa que los PCs tengan IPs en la misma subred y que estén conectados al switch.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.10.10', targetIp: '192.168.10.20', connected: true } },
    },
    {
      order: 8,
      title: 'FALLA 1: Introducir cable desconectado',
      instructions: `Introduce deliberadamente una falla: desconecta el cable entre el switch y PC2.

Esto simula una falla física común donde un cable se desconecta accidentalmente.

NO corrijas el error todavía. Primero diagnostícalo.`,
      hint: 'Esta falla hace que PC2 pierda toda conectividad con el resto de la red porque no tiene conexión física.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 9,
      title: 'FALLA 1: Diagnosticar la falla',
      instructions: `Diagnostica la falla introducida:

1. Haz ping desde PC1 (192.168.10.10) hacia PC2 (192.168.10.20) — debe FALLAR
2. Haz ping desde PC1 hacia PC3 (192.168.10.30) — debe FUNCIONAR
3. Revisa las conexiones físicas del PC2
4. Identifica que el cable entre PC2 y el switch está desconectado
5. Documenta: ¿Qué síntoma observaste? ¿Qué herramienta usaste? ¿Cuál es la causa raíz?`,
      hint: 'El ping a PC2 falla pero el ping a PC3 funciona. Esto indica que el problema es específico de PC2, no de la red entera. Revisa las conexiones físicas de PC2.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 10,
      title: 'FALLA 1: Corregir la falla',
      instructions: 'Corrige la falla: reconecta el cable entre PC2 y el switch. Verifica con ping desde PC1 (192.168.10.10) hacia PC2 (192.168.10.20) que la conectividad se restauró.',
      hint: 'Después de reconectar el cable, el ping desde PC1 hacia PC2 debe ser exitoso.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.10.10', targetIp: '192.168.10.20', connected: true } },
    },
    {
      order: 11,
      title: 'FALLA 2: Introducir interfaz del router apagada',
      instructions: `Introduce deliberadamente una segunda falla: apaga (shutdown) la interfaz del router que está conectada al switch.

Esto simula una falla donde la interfaz del router se desactiva, ya sea por error humano o por un problema de configuración.

NO corrijas el error todavía. Primero diagnostícalo.`,
      hint: 'Esta falla hace que todos los PCs pierdan conectividad hacia el router y hacia Internet, pero la conectividad entre PCs en la misma subred sigue funcionando.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 12,
      title: 'FALLA 2: Diagnosticar la falla',
      instructions: `Diagnostica la segunda falla:

1. Haz ping desde PC1 (192.168.10.10) hacia PC2 (192.168.10.20) — debe FUNCIONAR (misma subred, no pasa por el router)
2. Haz ping desde PC1 hacia el router (192.168.10.1) — debe FALLAR
3. Haz ping desde PC2 hacia el router — también debe FALLAR
4. Verifica el estado de las interfaces del router (show ip interface brief)
5. Identifica que la interfaz del router está apagada (administratively down)
6. Documenta: ¿Por qué el ping entre PCs funciona pero al router no? ¿Cuál es la causa raíz?`,
      hint: 'El ping entre PCs funciona porque están en la misma subred y el tráfico no pasa por el router. El ping al router falla porque su interfaz está apagada y no responde. Usa "show ip interface brief" en el router para ver el estado.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
    {
      order: 13,
      title: 'FALLA 2: Corregir la falla',
      instructions: 'Corrige la falla: reactiva (no shutdown) la interfaz del router. Verifica con ping desde PC1 (192.168.10.10) hacia el router (192.168.10.1) que la conectividad se restauró.',
      hint: 'Después de reactivar la interfaz del router, el ping desde cualquier PC hacia el router (192.168.10.1) debe ser exitoso.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.10.10', targetIp: '192.168.10.1', connected: true } },
    },
    {
      order: 14,
      title: 'Documentar la red con leyenda de IPs',
      instructions: `Documenta tu red completa. Crea un diagrama (a mano o con herramienta) que incluya:
- Todos los dispositivos: 3 PCs, switch, router
- La leyenda con las direcciones IP de cada equipo
- Las conexiones entre dispositivos
- La subred utilizada (192.168.10.0/24)
- Documenta también las 2 fallas que introduciste: síntoma, diagnóstico, causa y solución

La documentación debe entregarse al profesor junto con el simulador completado.`,
      hint: 'La leyenda debe mostrar: nombre del dispositivo, dirección IP, máscara de subred y gateway. Para cada falla documenta: qué falló, cómo lo diagnosticaste, y cómo lo resolviste.',
      validation: { type: 'observation', labId: labGustavo1Id },
    },
  ];

  for (const s of labGustavo1Steps) {
    await prisma.labStep.upsert({
      where: { labId_order: { labId: labGustavo1.id, order: s.order } },
      update: {},
      create: { labId: labGustavo1.id, ...s },
    });
  }
  console.log(`   ✓ Gustavo - Práctica 1: ${labGustavo1.title} (${labGustavo1Steps.length} pasos)`);

  await prisma.labAssignment.upsert({
    where: { labId_courseId: { labId: labGustavo1.id, courseId: cursoGustavo.id } },
    update: {},
    create: { labId: labGustavo1.id, courseId: cursoGustavo.id },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRÁCTICA 2 — MIRIAM: Proyecto de mejora del edificio AIS
  // Enfoque: VLANs + segmentación de seguridad + WiFi
  // ══════════════════════════════════════════════════════════════════════════
  const labMiriam2Id = 'lab-miriam-edificio-ais';
  const labMiriam2 = await prisma.lab.upsert({
    where: { id: labMiriam2Id },
    update: {},
    create: {
      id: labMiriam2Id,
      title: 'Práctica 2: Proyecto de mejora de red — Edificio AIS',
      description: `Estudiar y analizar el proyecto de red macro del edificio de AIS (3 pisos, 16 aulas, 3 laboratorios de 15 PCs cada uno) y proponer mejoras enfocadas en VLANs, segmentación de seguridad y WiFi.

Contexto del edificio:
- 3 pisos
- 16 aulas (6 en Piso 1, 5 en Piso 2, 5 en Piso 3)
- 3 laboratorios (1 por piso), cada uno con 15 computadoras (45 PCs total)
- Cada aula tiene al menos 1 PC para el docente
- Total: ~74 dispositivos

Tu proyecto de mejora se enfoca en:
1. Implementar VLANs para reducir switches físicos
2. Segmentación de seguridad por zonas (Académica, Administrativa, Invitados)
3. Agregar puntos de acceso WiFi en aulas

IMPORTANTE: El simulador tiene un límite de 20 dispositivos. Coloca la topología simplificada en el canvas. El croquis completo se documenta externamente.`,
      difficulty: 'ADVANCED',
      topic: 'Diseño de Redes',
      status: 'PUBLISHED',
      estimatedMinutes: 90,
      creatorId: teacher.id,
      topologyData: { devices: [], links: [] },
    },
  });

  const labMiriam2Steps = [
    {
      order: 1,
      title: 'Analizar la red existente del edificio AIS',
      instructions: `Analiza la red actual del edificio de AIS:

- 3 pisos con 16 aulas y 3 laboratorios (15 PCs cada uno)
- Topología jerárquica: router ISP → firewall → 3 switches de distribución (uno por piso) → 6 switches de acceso
- 7 subredes físicas separadas
- 9 switches físicos en total
- 2 servidores (DHCP/DNS y archivos)

Identifica los problemas de la red actual relacionados con:
- Cantidad excesiva de switches físicos
- Falta de segmentación de seguridad por zonas
- Ausencia de WiFi en aulas

Documenta tu análisis.`,
      hint: 'La red actual usa 9 switches físicos porque cada subred tiene su propio switch. Con VLANs se puede reducir esto significativamente.',
      validation: { type: 'observation', labId: labMiriam2Id },
    },
    {
      order: 2,
      title: 'Diseñar el esquema de VLANs',
      instructions: `Propón un esquema de VLANs para reemplazar las subredes físicas separadas:

| VLAN | Zona | Subred |
|------|------|--------|
| VLAN 10 | Aulas Piso 1 | 192.168.1.0/24 |
| VLAN 20 | Aulas Piso 2 | 192.168.2.0/24 |
| VLAN 30 | Aulas Piso 3 | 192.168.3.0/24 |
| VLAN 100 | Lab 1 | 192.168.10.0/24 |
| VLAN 200 | Lab 2 | 192.168.20.0/24 |
| VLAN 300 | Lab 3 | 192.168.30.0/24 |
| VLAN 999 | Servidores | 10.0.0.0/24 |

Explica cómo las VLANs permiten usar menos switches físicos manteniendo la separación de tráfico.`,
      hint: 'Con VLANs, un solo switch managed puede manejar múltiples VLANs. En lugar de 9 switches físicos, podrías usar 3 (uno por piso) con VLANs configuradas.',
      validation: { type: 'observation', labId: labMiriam2Id },
    },
    {
      order: 3,
      title: 'Diseñar la segmentación de seguridad por zonas',
      instructions: `Propón zonas de seguridad en el firewall:

1. Zona Internet (WAN) — tráfico externo
2. Zona Académica — aulas y laboratorios (VLANs 10-300)
3. Zona Administrativa — oficinas de profesores (VLAN 500)
4. Zona Invitados — WiFi de visitantes (VLAN 600)
5. Zona Servidores — DHCP/DNS y archivos (VLAN 999)

Define al menos 3 reglas de firewall:
- Invitados NO pueden acceder a Académica ni Administrativa
- Académica puede acceder a Servidores (DHCP/DNS)
- Administrativa puede acceder a todas las zonas

Documenta las reglas con acción, origen y destino.`,
      hint: 'La segmentación por zonas limita el impacto de un ataque. Si un dispositivo de la zona Invitados se compromete, no puede acceder a la red Académica.',
      validation: { type: 'observation', labId: labMiriam2Id },
    },
    {
      order: 4,
      title: 'Diseñar el WiFi para aulas',
      instructions: `Propón la instalación de puntos de acceso WiFi:

- 2 puntos de acceso por piso (6 total)
- Conectados al switch de distribución de cada piso
- VLAN dedicada para WiFi de invitados (VLAN 600)
- VLAN separada para WiFi académico (VLAN 700)

Justifica por qué el WiFi necesita VLANs separadas para invitados y académico.`,
      hint: 'Separar WiFi de invitados y académico en VLANs distintas evita que los visitantes accedan a los recursos internos del edificio.',
      validation: { type: 'observation', labId: labMiriam2Id },
    },
    {
      order: 5,
      title: 'Colocar el router principal en el canvas',
      instructions: 'Agrega el router ISP principal al canvas. IP: 10.0.0.1. Este router es el gateway hacia Internet.',
      hint: 'El router ISP se conecta al firewall.',
      validation: { type: 'device_count', expected: { deviceType: 'ROUTER', minCount: 1 } },
    },
    {
      order: 6,
      title: 'Colocar el firewall de borde',
      instructions: 'Agrega un firewall al canvas. Interfaces: WAN 10.0.0.2, LAN 172.16.0.1. El firewall implementa las zonas de seguridad que diseñaste.',
      hint: 'El firewall va entre el router ISP y los switches de distribución.',
      validation: { type: 'device_count', expected: { deviceType: 'FIREWALL', minCount: 1 } },
    },
    {
      order: 7,
      title: 'Colocar los 3 switches de distribución (con VLANs)',
      instructions: `Agrega 3 switches de distribución al canvas (uno por piso). Estos switches ahora soportan VLANs:

- Switch Dist. Piso 1: VLANs 10, 100 — IP 192.168.1.1
- Switch Dist. Piso 2: VLANs 20, 200 — IP 192.168.2.1
- Switch Dist. Piso 3: VLANs 30, 300 — IP 192.168.3.1

Con VLANs, cada switch de distribución maneja el tráfico de aulas y laboratorios de su piso sin necesidad de switches de acceso separados.`,
      hint: 'Los switches de distribución con VLANs reemplazan a los 6 switches de acceso de la red original.',
      validation: { type: 'device_count', expected: { deviceType: 'SWITCH', minCount: 3 } },
    },
    {
      order: 8,
      title: 'Colocar al menos 1 servidor (DHCP/DNS)',
      instructions: 'Agrega al menos 1 servidor al canvas. IP: 10.0.0.10, red de servidores VLAN 999 (10.0.0.0/24).',
      hint: 'El servidor va en la VLAN 999 detrás del firewall.',
      validation: { type: 'device_count', expected: { deviceType: 'SERVER', minCount: 1 } },
    },
    {
      order: 9,
      title: 'Colocar PCs representativos de cada laboratorio',
      instructions: `Agrega al menos 3 PCs al canvas, uno por laboratorio:
- PC Lab 1: 192.168.10.10, gateway 192.168.10.1 (VLAN 100)
- PC Lab 2: 192.168.20.10, gateway 192.168.20.1 (VLAN 200)
- PC Lab 3: 192.168.30.10, gateway 192.168.30.1 (VLAN 300)`,
      hint: 'Cada PC representativo se conecta al switch de distribución de su piso en la VLAN correspondiente.',
      validation: { type: 'device_count', expected: { deviceType: 'PC', minCount: 3 } },
    },
    {
      order: 10,
      title: 'Conectar y configurar todos los dispositivos',
      instructions: `Conecta los dispositivos:
1. Router ISP ←→ Firewall
2. Firewall ←→ Switch Dist. Piso 1, 2 y 3
3. Cada Switch Dist. ←→ PC de su laboratorio
4. Firewall ←→ Servidor

Configura las IPs principales (router 10.0.0.1, firewall WAN 10.0.0.2, switches 192.168.x.1, PCs 192.168.x.10, servidor 10.0.0.10).`,
      hint: 'El firewall es el punto central de la topología.',
      validation: { type: 'observation', labId: labMiriam2Id },
    },
    {
      order: 11,
      title: 'Verificar conectividad entre pisos',
      instructions: 'Verifica que el PC del Lab 1 (192.168.10.10) pueda comunicarse con el PC del Lab 2 (192.168.20.10). Usa ping.',
      hint: 'El tráfico entre VLANs pasa por el firewall.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.10.10', targetIp: '192.168.20.10', connected: true } },
    },
    {
      order: 12,
      title: 'Elaborar el croquis y documentar el proyecto',
      instructions: `Elabora el croquis completo del edificio mejorado y documenta:

1. Croquis con los 3 pisos, 16 aulas, 3 laboratorios y todos los dispositivos
2. Tabla de VLANs con subredes asignadas
3. Zonas de seguridad del firewall con reglas
4. Ubicación de los puntos de acceso WiFi
5. Justificación de las mejoras:
   - ¿Por qué VLANs en lugar de subredes físicas?
   - ¿Por qué segmentar por zonas de seguridad?
   - ¿Por qué WiFi separado para invitados y académico?
6. Comparación: red original (9 switches) vs red mejorada (3 switches con VLANs)

La documentación debe entregarse al profesor.`,
      hint: 'Consulta docs/croquis-red-edificio.md del repositorio como referencia para el croquis.',
      validation: { type: 'observation', labId: labMiriam2Id },
    },
  ];

  for (const s of labMiriam2Steps) {
    await prisma.labStep.upsert({
      where: { labId_order: { labId: labMiriam2.id, order: s.order } },
      update: {},
      create: { labId: labMiriam2.id, ...s },
    });
  }
  console.log(`   ✓ Miriam - Práctica 2: ${labMiriam2.title} (${labMiriam2Steps.length} pasos)`);

  await prisma.labAssignment.upsert({
    where: { labId_courseId: { labId: labMiriam2.id, courseId: cursoMiriam.id } },
    update: {},
    create: { labId: labMiriam2.id, courseId: cursoMiriam.id },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRÁCTICA 2 — GUSTAVO: Proyecto de mejora del edificio AIS
  // Enfoque: Redundancia + LACP + monitoreo + backbone de fibra
  // ══════════════════════════════════════════════════════════════════════════
  const labGustavo2Id = 'lab-gustavo-edificio-ais';
  const labGustavo2 = await prisma.lab.upsert({
    where: { id: labGustavo2Id },
    update: {},
    create: {
      id: labGustavo2Id,
      title: 'Práctica 2: Proyecto de mejora de red — Edificio AIS',
      description: `Estudiar y analizar el proyecto de red macro del edificio de AIS (3 pisos, 16 aulas, 3 laboratorios de 15 PCs cada uno) y proponer mejoras enfocadas en redundancia, enlaces agregados (LACP), monitoreo de red y backbone de fibra óptica.

Contexto del edificio:
- 3 pisos
- 16 aulas (6 en Piso 1, 5 en Piso 2, 5 en Piso 3)
- 3 laboratorios (1 por piso), cada uno con 15 computadoras (45 PCs total)
- Cada aula tiene al menos 1 PC para el docente
- Total: ~74 dispositivos

Tu proyecto de mejora se enfoca en:
1. Redundancia en la capa core (router y firewall duplicados, HA)
2. Enlaces agregados (LACP) entre firewall y switches de distribución
3. Monitoreo de red con NMS (Zabbix/LibreNMS)
4. Backbone de fibra óptica entre pisos

IMPORTANTE: El simulador tiene un límite de 20 dispositivos. Coloca la topología simplificada en el canvas. El croquis completo se documenta externamente.`,
      difficulty: 'ADVANCED',
      topic: 'Diseño de Redes',
      status: 'PUBLISHED',
      estimatedMinutes: 90,
      creatorId: teacher.id,
      topologyData: { devices: [], links: [] },
    },
  });

  const labGustavo2Steps = [
    {
      order: 1,
      title: 'Analizar la red existente del edificio AIS',
      instructions: `Analiza la red actual del edificio de AIS:

- 3 pisos con 16 aulas y 3 laboratorios (15 PCs cada uno)
- Topología jerárquica: router ISP → firewall → 3 switches de distribución → 6 switches de acceso
- 1 solo router y 1 solo firewall (sin redundancia)
- Enlaces simples (1 cable) entre firewall y switches
- Sin monitoreo de red
- Cable UTP entre pisos (máximo 1Gbps a 100m)

Identifica los problemas de la red actual relacionados con:
- Puntos únicos de falla (router y firewall sin redundancia)
- Enlaces sin agregación (si un cable falla, el piso se queda sin red)
- Falta de visibilidad del estado de la red
- Cuello de botella en el backbone entre pisos

Documenta tu análisis.`,
      hint: 'Si el único firewall falla, todo el edificio se queda sin Internet. Si el cable entre el firewall y un switch de distribución se corta, todo ese piso se queda sin red.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
    {
      order: 2,
      title: 'Diseñar la redundancia en la capa core',
      instructions: `Propón redundancia en la capa core:

1. Duplicar el router ISP (configuración activo/pasivo HA)
   - Router 1: 10.0.0.1 (activo)
   - Router 2: 10.0.0.3 (pasivo, toma el tráfico si Router 1 cae)

2. Duplicar el firewall (configuración activo/pasivo HA)
   - Firewall 1: WAN 10.0.0.2 (activo)
   - Firewall 2: WAN 10.0.0.4 (pasivo)

Explica cómo la configuración HA asegura que si un dispositivo falla, el secundario toma el tráfico automáticamente sin interrupción.`,
      hint: 'La alta disponibilidad (HA) activo/pasivo significa que el dispositivo secundario monitorea al primario y toma el tráfico si detecta que cayó.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
    {
      order: 3,
      title: 'Diseñar enlaces agregados (LACP)',
      instructions: `Propón enlaces LACP entre el firewall y cada switch de distribución:

- Firewall ←→ Switch Dist. Piso 1: 2 cables agregados (2Gbps totales)
- Firewall ←→ Switch Dist. Piso 2: 2 cables agregados (2Gbps totales)
- Firewall ←→ Switch Dist. Piso 3: 2 cables agregados (2Gbps totales)

Explica los beneficios de LACP:
1. Doble ancho de banda (2Gbps en lugar de 1Gbps)
2. Si un cable falla, el otro sigue funcionando
3. Balanceo de carga entre los cables

Documenta cómo configurar LACP en los switches.`,
      hint: 'LACP (Link Aggregation Control Protocol) combina múltiples cables físicos en un solo enlace lógico. Si un cable se corta, el enlace sigue funcionando con el cable restante.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
    {
      order: 4,
      title: 'Diseñar el monitoreo de red (NMS)',
      instructions: `Propón instalar un servidor de monitoreo de red (NMS):

Herramienta recomendada: LibreNMS o Zabbix (software libre)

Funciones del NMS:
1. Monitorear todos los switches y routers por SNMP
2. Alertar por email cuando un dispositivo se cae
3. Mostrar gráficos de ancho de banda por puerto
4. Detectar saturación en los enlaces de los laboratorios
5. Histórico de disponibilidad

Ubicación: red de servidores (10.0.0.0/24), IP 10.0.0.30

Justifica por qué el monitoreo es importante para una red con 74 dispositivos.`,
      hint: 'Sin monitoreo, te enteras de un problema cuando alguien se queja. Con NMS, te enteras ANTES de que los usuarios notes el problema.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
    {
      order: 5,
      title: 'Diseñar el backbone de fibra óptica',
      instructions: `Propón reemplazar los enlaces UTP entre pisos con fibra óptica:

Enlaces actuales (UTP Cat6):
- Máximo 1Gbps
- Límite de 100 metros
- Susceptible a interferencia electromagnética

Enlaces propuestos (fibra óptica multimodo):
- 10Gbps (10 veces más rápido)
- Sin límite práctico de distancia dentro del edificio
- Inmune a interferencia electromagnética

Justifica por qué 45 PCs por laboratorio más las aulas necesitan más de 1Gbps en el backbone.`,
      hint: 'Con 45 PCs en laboratorios más 16 PCs en aulas, el tráfico en horas pico puede superar 1Gbps. La fibra da margen para crecimiento futuro.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
    {
      order: 6,
      title: 'Colocar el router principal en el canvas',
      instructions: 'Agrega el router ISP principal al canvas. IP: 10.0.0.1. En tu diseño mejorado, este router tiene un backup (10.0.0.3) pero en el canvas solo colocas el principal.',
      hint: 'El router ISP se conecta al firewall.',
      validation: { type: 'device_count', expected: { deviceType: 'ROUTER', minCount: 1 } },
    },
    {
      order: 7,
      title: 'Colocar el firewall de borde',
      instructions: 'Agrega un firewall al canvas. Interfaces: WAN 10.0.0.2, LAN 172.16.0.1. En tu diseño mejorado, este firewall tiene un backup (10.0.0.4) pero en el canvas solo colocas el principal.',
      hint: 'El firewall va entre el router ISP y los switches de distribución.',
      validation: { type: 'device_count', expected: { deviceType: 'FIREWALL', minCount: 1 } },
    },
    {
      order: 8,
      title: 'Colocar los 3 switches de distribución (con LACP)',
      instructions: `Agrega 3 switches de distribución al canvas (uno por piso). En tu diseño mejorado, cada switch se conecta al firewall con 2 cables agregados (LACP):

- Switch Dist. Piso 1: IP 192.168.1.1 — 2 cables LACP al firewall
- Switch Dist. Piso 2: IP 192.168.2.1 — 2 cables LACP al firewall
- Switch Dist. Piso 3: IP 192.168.3.1 — 2 cables LACP al firewall

En el canvas solo colocas 1 cable por switch (el simulador no soporta LACP visualmente), pero documentas que en la red real son 2 cables con LACP.`,
      hint: 'LACP duplica el ancho de banda y provee redundancia si un cable falla.',
      validation: { type: 'device_count', expected: { deviceType: 'SWITCH', minCount: 3 } },
    },
    {
      order: 9,
      title: 'Colocar al menos 1 servidor (DHCP/DNS + NMS)',
      instructions: 'Agrega al menos 1 servidor al canvas. IP: 10.0.0.10. En tu diseño mejorado, hay un segundo servidor para monitoreo NMS (10.0.0.30), pero en el canvas colocas el principal.',
      hint: 'El servidor va en la red de servidores (10.0.0.0/24) detrás del firewall.',
      validation: { type: 'device_count', expected: { deviceType: 'SERVER', minCount: 1 } },
    },
    {
      order: 10,
      title: 'Colocar PCs representativos de cada laboratorio',
      instructions: `Agrega al menos 3 PCs al canvas, uno por laboratorio:
- PC Lab 1: 192.168.10.10, gateway 192.168.10.1
- PC Lab 2: 192.168.20.10, gateway 192.168.20.1
- PC Lab 3: 192.168.30.10, gateway 192.168.30.1`,
      hint: 'Cada PC representativo se conecta al switch de distribución de su piso.',
      validation: { type: 'device_count', expected: { deviceType: 'PC', minCount: 3 } },
    },
    {
      order: 11,
      title: 'Conectar y configurar todos los dispositivos',
      instructions: `Conecta los dispositivos:
1. Router ISP ←→ Firewall
2. Firewall ←→ Switch Dist. Piso 1, 2 y 3
3. Cada Switch Dist. ←→ PC de su laboratorio
4. Firewall ←→ Servidor

Configura las IPs principales (router 10.0.0.1, firewall WAN 10.0.0.2, switches 192.168.x.1, PCs 192.168.x.10, servidor 10.0.0.10).`,
      hint: 'El firewall es el punto central de la topología.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
    {
      order: 12,
      title: 'Verificar conectividad entre pisos',
      instructions: 'Verifica que el PC del Lab 1 (192.168.10.10) pueda comunicarse con el PC del Lab 2 (192.168.20.10). Usa ping.',
      hint: 'El tráfico entre pisos pasa por los switches de distribución y el firewall.',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.10.10', targetIp: '192.168.20.10', connected: true } },
    },
    {
      order: 13,
      title: 'Elaborar el croquis y documentar el proyecto',
      instructions: `Elabora el croquis completo del edificio mejorado y documenta:

1. Croquis con los 3 pisos, 16 aulas, 3 laboratorios y todos los dispositivos
2. Topología con redundancia (router y firewall duplicados HA)
3. Enlaces LACP entre firewall y switches (2 cables por enlace)
4. Backbone de fibra óptica entre pisos
5. Servidor NMS para monitoreo (10.0.0.30)
6. Justificación de las mejoras:
   - ¿Por qué redundancia en la capa core?
   - ¿Por qué LACP en los enlaces?
   - ¿Por qué fibra óptica en el backbone?
   - ¿Por qué monitoreo con NMS?
7. Comparación: red original (1Gbps, sin redundancia) vs red mejorada (10Gbps, HA, LACP, monitoreo)

La documentación debe entregarse al profesor.`,
      hint: 'Consulta docs/croquis-red-edificio.md del repositorio como referencia para el croquis.',
      validation: { type: 'observation', labId: labGustavo2Id },
    },
  ];

  for (const s of labGustavo2Steps) {
    await prisma.labStep.upsert({
      where: { labId_order: { labId: labGustavo2.id, order: s.order } },
      update: {},
      create: { labId: labGustavo2.id, ...s },
    });
  }
  console.log(`   ✓ Gustavo - Práctica 2: ${labGustavo2.title} (${labGustavo2Steps.length} pasos)`);

  await prisma.labAssignment.upsert({
    where: { labId_courseId: { labId: labGustavo2.id, courseId: cursoGustavo.id } },
    update: {},
    create: { labId: labGustavo2.id, courseId: cursoGustavo.id },
  });

  console.log('\n✅ Prácticas creadas!');
  console.log('   ────────────────────────────────');
  console.log(`   Miriam (${miriam.email}):`);
  console.log(`     Práctica 1: ${labMiriam1.title} (${labMiriam1Steps.length} pasos)`);
  console.log(`     Práctica 2: ${labMiriam2.title} (${labMiriam2Steps.length} pasos)`);
  console.log(`   Gustavo (${gustavo.email}):`);
  console.log(`     Práctica 1: ${labGustavo1.title} (${labGustavo1Steps.length} pasos)`);
  console.log(`     Práctica 2: ${labGustavo2.title} (${labGustavo2Steps.length} pasos)`);
  console.log('   ────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
