// vite-xss-fix.ts
import { Plugin } from 'vite';

export function viteXssMiddleware(): Plugin {
  const middleware = (req: any, res: any, next: any) => {
    const originalEnd = res.end;
    const chunks: any[] = [];

    res.end = function(chunk?: any) {
      if (chunk) chunks.push(Buffer.from(chunk));
      
      const body = Buffer.concat(chunks).toString();
      
      // If Vite's error message is reflecting user input, replace it
      if (body.includes('did you mean to visit') && body.includes('<a href=')) {
        const safe = 
        `<!DOCTYPE html>
            <html>
            <head><title>404 Not Found</title></head>
            <body><h1>404 - Page Not Found</h1></body>
            </html>`;
        res.setHeader('Content-Type', 'text/html');
        return originalEnd.call(res, safe);
      }
      
      return originalEnd.call(res, Buffer.concat(chunks));
    };

    next();
  };

  return {
    name: 'vite-xss-fix',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}