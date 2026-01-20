export const DEMO_MODE = true;

// Paths that are allowed to be accessed in Demo Mode
export const ALLOWED_PATHS = [
  '/',
  '/club',
  '/mitgliedschaft',
  '/coming-soon',
  '/kontakt', // Usually good to keep contact open
];

// Check if a path is allowed
export function isPathAllowed(path: string): boolean {
  if (!DEMO_MODE) return true;
  
  // Normalize path
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  if (normalizedPath === '') return true; // root is '/'

  return ALLOWED_PATHS.some(allowed => {
    if (allowed === '/') return normalizedPath === '';
    return normalizedPath === allowed || normalizedPath.startsWith(allowed + '/');
  });
}
