import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { COURSE_DATA, LAB_DATA } from './generated-seed-data';

const prisma = new PrismaClient();
const isSQLite = (process.env.DATABASE_URL || '').startsWith('file:');
const jf = (d: unknown): any => isSQLite ? JSON.stringify(d) : d;

const TWO_PC = jf({ devices:[
  {id:'pc1',type:'PC',label:'PC1',x:100,y:200,interfaces:[{id:'eth0-pc1',name:'eth0',mac:'AA:BB:CC:00:00:01',isUp:true}],config:{}},
  {id:'pc2',type:'PC',label:'PC2',x:500,y:200,interfaces:[{id:'eth0-pc2',name:'eth0',mac:'AA:BB:CC:00:00:02',isUp:true}],config:{}},
  {id:'sw1',type:'SWITCH',label:'Switch1',x:300,y:200,interfaces:[{id:'fa0-sw1',name:'fa0/1',mac:'AA:BB:CC:00:01:01',isUp:true},{id:'fa1-sw1',name:'fa0/2',mac:'AA:BB:CC:00:01:02',isUp:true}],config:{}},
], links:[
  {id:'l1',sourceDeviceId:'pc1',sourceInterfaceId:'eth0-pc1',targetDeviceId:'sw1',targetInterfaceId:'fa0-sw1'},
  {id:'l2',sourceDeviceId:'sw1',sourceInterfaceId:'fa1-sw1',targetDeviceId:'pc2',targetInterfaceId:'eth0-pc2'},
]});

const ROUTED = jf({ devices:[
  {id:'pc1',type:'PC',label:'PC1',x:50,y:200,interfaces:[{id:'eth0-pc1',name:'eth0',mac:'AA:BB:CC:00:00:01',isUp:true}],config:{}},
  {id:'r1',type:'ROUTER',label:'Router1',x:300,y:200,interfaces:[{id:'fa0-r1',name:'fa0/0',mac:'AA:BB:CC:00:02:01',isUp:true},{id:'fa1-r1',name:'fa0/1',mac:'AA:BB:CC:00:02:02',isUp:true}],config:{}},
  {id:'pc2',type:'PC',label:'PC2',x:550,y:200,interfaces:[{id:'eth0-pc2',name:'eth0',mac:'AA:BB:CC:00:00:02',isUp:true}],config:{}},
], links:[
  {id:'l1',sourceDeviceId:'pc1',sourceInterfaceId:'eth0-pc1',targetDeviceId:'r1',targetInterfaceId:'fa0-r1'},
  {id:'l2',sourceDeviceId:'r1',sourceInterfaceId:'fa1-r1',targetDeviceId:'pc2',targetInterfaceId:'eth0-pc2'},
]});

const SERVER = jf({ devices:[
  {id:'srv1',type:'SERVER',label:'Servidor',x:300,y:80,interfaces:[{id:'eth0-srv1',name:'eth0',mac:'AA:BB:CC:00:03:01',isUp:true}],config:{}},
  {id:'sw1',type:'SWITCH',label:'Switch1',x:300,y:250,interfaces:[{id:'fa0-sw1',name:'fa0/1',mac:'AA:BB:CC:00:01:01',isUp:true},{id:'fa1-sw1',name:'fa0/2',mac:'AA:BB:CC:00:01:02',isUp:true},{id:'fa2-sw1',name:'fa0/3',mac:'AA:BB:CC:00:01:03',isUp:true}],config:{}},
  {id:'pc1',type:'PC',label:'PC1',x:100,y:400,interfaces:[{id:'eth0-pc1',name:'eth0',mac:'AA:BB:CC:00:00:01',isUp:true}],config:{}},
  {id:'pc2',type:'PC',label:'PC2',x:500,y:400,interfaces:[{id:'eth0-pc2',name:'eth0',mac:'AA:BB:CC:00:00:02',isUp:true}],config:{}},
], links:[
  {id:'l1',sourceDeviceId:'srv1',sourceInterfaceId:'eth0-srv1',targetDeviceId:'sw1',targetInterfaceId:'fa0-sw1'},
  {id:'l2',sourceDeviceId:'sw1',sourceInterfaceId:'fa1-sw1',targetDeviceId:'pc1',targetInterfaceId:'eth0-pc1'},
  {id:'l3',sourceDeviceId:'sw1',sourceInterfaceId:'fa2-sw1',targetDeviceId:'pc2',targetInterfaceId:'eth0-pc2'},
]});

async function main() {
  console.log(`🌱 Seeding database... (${isSQLite ? 'SQLite' : 'PostgreSQL'})`);

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@silearning.com' }, update: {},
    create: { email: 'admin@silearning.com', name: 'Administrador', password: adminPassword, role: 'ADMIN' },
  });

  const teacherPassword = await bcrypt.hash('Teacher123!', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'profesor@silearning.com' }, update: {},
    create: { email: 'profesor@silearning.com', name: 'Prof. García', password: teacherPassword, role: 'TEACHER' },
  });

  const studentPassword = await bcrypt.hash('Student123!', 12);
  const student = await prisma.user.upsert({
    where: { email: 'alumno@silearning.com' }, update: {},
    create: { email: 'alumno@silearning.com', name: 'María López', password: studentPassword, role: 'STUDENT' },
  });

  // ── 50 Courses ─────────────────────────────────────────────────────────────
  const createdCourses: string[] = [];
  for (const c of COURSE_DATA) {
    await prisma.course.upsert({
      where: { id: c.id }, update: {},
      create: { id: c.id, name: c.name, description: c.desc, teacherId: teacher.id },
    });
    createdCourses.push(c.id);
  }
  console.log(`   ✓ ${createdCourses.length} cursos`);

  // Enroll student in first 5 courses
  for (const cid of createdCourses.slice(0, 5)) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: cid } }, update: {},
      create: { userId: student.id, courseId: cid },
    });
  }

  // ── 80 Labs (5 per topic) ────────────────────────────────────────────────────
  const topoByDiff = [TWO_PC, TWO_PC, ROUTED, SERVER, SERVER];
  const labIds: string[] = [];
  for (let i = 0; i < LAB_DATA.length; i++) {
    const l = LAB_DATA[i];
    const topo = topoByDiff[i % 5];
    const lab = await prisma.lab.upsert({
      where: { id: l.id }, update: {},
      create: {
        id: l.id, title: l.title, description: l.desc,
        difficulty: l.diff as any, topic: l.topic,
        status: 'PUBLISHED', estimatedMinutes: l.mins,
        creatorId: teacher.id, topologyData: topo,
      },
    });
    labIds.push(lab.id);

    // 3 generic steps per lab
    const steps = [
      { order: 1, title: 'Preparar el escenario', instructions: `Revisa la topología del laboratorio "${l.title}" e identifica todos los dispositivos.`, hint: 'Lee el enunciado completo antes de empezar.', validation: jf({ type: 'observation', labId: l.id }) },
      { order: 2, title: 'Configurar dispositivos', instructions: `Aplica las configuraciones indicadas en el laboratorio de ${l.topic}.`, hint: 'Sigue los pasos del enunciado en orden.', validation: jf({ type: 'config', topic: l.topic }) },
      { order: 3, title: 'Verificar y documentar', instructions: 'Verifica que la red funciona correctamente y documenta los resultados obtenidos.', hint: 'Usa ping o traceroute para comprobar la conectividad.', validation: jf({ type: 'ping', expected: { success: true } }) },
    ];
    for (const s of steps) {
      await prisma.labStep.upsert({
        where: { labId_order: { labId: lab.id, order: s.order } }, update: {},
        create: { labId: lab.id, order: s.order, title: s.title, instructions: s.instructions, hint: s.hint, validation: s.validation },
      });
    }
  }
  console.log(`   ✓ ${labIds.length} laboratorios`);

  // Assign first lab of each topic to courses (max 10 assignments, one per course)
  const numAssignments = Math.min(10, labIds.length);
  for (let i = 0; i < numAssignments; i++) {
    const labId = labIds[i];
    const courseId = createdCourses[i % createdCourses.length];
    try {
      await prisma.labAssignment.upsert({
        where: { labId_courseId: { labId, courseId } }, update: {},
        create: { labId, courseId },
      });
    } catch {
      // Skip if assignment already exists
    }
  }

  console.log('✅ Seed completado!');
  console.log(`   Admin:   ${admin.email}`);
  console.log(`   Profesor: ${teacher.email}`);
  console.log(`   Alumno:  ${student.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
