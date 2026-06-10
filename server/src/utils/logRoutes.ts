// Path: src/utils/logRoutes.ts
// Purpose: Debug utility to print all registered API routes on startup
// Dependencies: express

import type { Express } from 'express';

export function logRegisteredRoutes(app: Express): void {
  if (process.env.NODE_ENV === 'production') return;
  console.log('\n📋 Registered API routes:');
  const routes: Array<{ method: string; path: string }> = [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = (app as any).router || (app as any)._router;
  if (!router || !router.stack) return;
  router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({ method: Object.keys(middleware.route.methods)[0].toUpperCase(), path: middleware.route.path });
    } else if (middleware.name === 'router') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push({ method: Object.keys(handler.route.methods)[0].toUpperCase(), path: handler.route.path });
        }
      });
    }
  });
  
  routes.forEach(r => console.log(`  ${r.method.padEnd(7)} ${r.path}`));
  console.log('');
}
