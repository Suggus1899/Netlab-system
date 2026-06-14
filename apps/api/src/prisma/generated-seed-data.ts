// Auto-generated seed data

export const COURSE_DATA = [
  { id: 'c1', name: 'Fundamentos de Redes', desc: 'Conceptos básicos de networking' },
  { id: 'c2', name: 'TCP/IP Avanzado', desc: 'Protocolos y arquitectura TCP/IP' },
  { id: 'c3', name: 'Enrutamiento', desc: 'Configuración de routers y protocolos' },
  { id: 'c4', name: 'Switching', desc: 'VLANs y configuración de switches' },
  { id: 'c5', name: 'Seguridad de Redes', desc: 'Firewalls, ACLs y seguridad' },
  { id: 'c6', name: 'Redes Inalámbricas', desc: 'WiFi, WLANs y configuración' },
  { id: 'c7', name: 'IPv6', desc: 'Direccionamiento IPv6' },
  { id: 'c8', name: 'QoS', desc: 'Calidad de servicio en redes' },
  { id: 'c9', name: 'Monitoreo', desc: 'Herramientas de monitoreo' },
  { id: 'c10', name: 'Troubleshooting', desc: 'Diagnóstico de problemas' },
];

const TOPICS = ['TCP/IP', 'Subnetting', 'Enrutamiento', 'Switching', 'Seguridad', 'Wireless', 'IPv6', 'QoS'];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export const LAB_DATA = Array.from({ length: 40 }, (_, i) => {
  const topic = TOPICS[i % TOPICS.length];
  const diff = DIFFICULTIES[i % 3];
  const diffLabel = diff === 'BEGINNER' ? 'Básico' : diff === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado';
  return {
    id: `lab${i + 1}`,
    title: `${topic} - Lab ${i + 1} (${diffLabel})`,
    desc: `Laboratorio práctico sobre ${topic} nivel ${diffLabel.toLowerCase()}.`,
    diff,
    topic,
    mins: 30 + (i % 3) * 15,
  };
});
