// Path: src/utils/skillUtils.ts
// Purpose: Helper functions for skill display and formatting
// Dependencies: none

export function getSkillAbbr(name: string): string {
  const overrides: Record<string, string> = {
    'Node.js': 'Nd', 'TypeScript': 'TS', 'JavaScript': 'JS',
    'MongoDB': 'Mg', 'PostgreSQL': 'PG', 'Redis': 'Rd',
    'Docker': 'Dk', 'Kubernetes': 'K8', 'Elasticsearch': 'Es',
    'GraphQL': 'Gf', 'Kafka': 'Kf', 'GitHub Actions': 'GH',
    'Express.js': 'Ex', 'NestJS': 'Ns', 'Fastify': 'Ft',
    'Terraform': 'Tf', 'Nginx': 'Nx', 'AWS': 'AW',
    'GCP': 'GC', 'Azure': 'Az', 'Linux': 'Lx',
    'Python': 'Py', 'Go': 'Go', 'Rust': 'Rs',
    'React': 'Rc', 'Next.js': 'Nx', 'Vue.js': 'Vu',
    'RabbitMQ': 'RQ', 'Prisma': 'Pr', 'Mongoose': 'Ms',
    'Jest': 'Jt', 'Vitest': 'Vt', 'Git': 'Gt',
    'Postman': 'Ps', 'CI/CD': 'CD', 'WebSocket': 'WS',
    'REST API': 'RA', 'gRPC': 'gR', 'OpenTelemetry': 'OT'
  };
  if (overrides[name]) return overrides[name];
  const words = name.trim().split(/[\s.\-_]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getCategoryColor(category: string): 'green' | 'blue' | 'amber' | 'purple' | 'muted' {
  switch (category.toLowerCase()) {
    case 'frontend':
    case 'backend':    return 'green';
    case 'database':   return 'blue';
    case 'devops':     return 'amber';
    case 'tools':      return 'purple';
    default:           return 'muted';
  }
}

export function getCategoryDisplayName(category: string): string {
  const map: Record<string, string> = {
    frontend: 'Frontend',
    backend:  'Backend',
    database: 'Databases',
    devops:   'DevOps & Infra',
    tools:    'Tools',
    other:    'Other'
  };
  return map[category.toLowerCase()] ?? category;
}

export const CATEGORY_ORDER = ['frontend', 'backend', 'database', 'devops', 'tools', 'other'];

export function getSkillLogoUrl(name: string, customUrl?: string): string {
  if (customUrl) return customUrl;

  const normalized = name.toLowerCase().trim();
  
  const slugMap: Record<string, string> = {
    'node': 'nodedotjs',
    'node.js': 'nodedotjs',
    'nodejs': 'nodedotjs',
    'reactjs': 'react',
    'react.js': 'react',
    'express.js': 'express',
    'tailwind css': 'tailwindcss',
    'tailwindcss': 'tailwindcss',
    'next.js': 'nextdotjs',
    'nextjs': 'nextdotjs',
    'vue.js': 'vuedotjs',
    'vuejs': 'vuedotjs',
    'c++': 'cplusplus',
    'c#': 'csharp',
    'amazon web services': 'amazonaws',
    'aws': 'amazonaws',
    'gcp': 'googlecloud',
    'google cloud': 'googlecloud',
    'github actions': 'githubactions',
    'ci/cd': 'githubactions',
    'html': 'html5',
    'html5': 'html5',
    'css': 'css3',
    'css3': 'css3',
    'js': 'javascript',
    'javascript': 'javascript',
    'ts': 'typescript',
    'typescript': 'typescript',
  };

  const slug = slugMap[normalized] || normalized.replace(/[^a-z0-9]/g, '');
  return `https://cdn.simpleicons.org/${slug}/white`;
}
