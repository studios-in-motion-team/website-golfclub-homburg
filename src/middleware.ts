import { defineMiddleware } from 'astro:middleware';
import { isPathAllowed } from './demoConfig';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const { pathname } = url;
  
  console.log(`[Middleware] Path: ${pathname}`);

  // 1. Allow static assets and internal Astro paths
  // Usually images, fonts, scripts etc. are in /public or handled by Astro
  if (
    pathname.includes('.') || // Files with extensions
    pathname.startsWith('/_astro') || // Astro internal
    pathname.startsWith('/api') // API routes if any
  ) {
    return next();
  }

  // 2. Allow specific paths defined in config
  if (isPathAllowed(pathname)) {
    return next();
  }

  // 3. Redirect everything else to coming-soon
  return context.redirect('/coming-soon');
});
