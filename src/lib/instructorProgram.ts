export function instructorProgramRedirect(program: string, pathname: string): string | null {
  const productionRoot = '/instructor/production';
  if (program !== 'production') return pathname.startsWith(productionRoot) ? '/instructor/dashboard' : null;
  if (!pathname.startsWith('/instructor/') || pathname.startsWith(productionRoot)) return null;
  if (['/instructor/profile-setup', '/instructor/photo-upload'].includes(pathname)) return null;
  const sharedPage = ['curriculum', 'messages', 'announcements', 'profile', 'ledger'].find(page => pathname === `/instructor/${page}`);
  return sharedPage ? `${productionRoot}/${sharedPage}` : productionRoot;
}