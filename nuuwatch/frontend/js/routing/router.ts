export type Routes = 'main' | 'view';

export function getHashPath(): string {
  // Remove the '#'
  return window.location.hash.substring(1);
}

export function getCurrentRoute(): [Routes, unknown[] | undefined]  {
  const path = getHashPath();
  const routes = path.split('/').filter(Boolean);

  let route: Routes = 'main';
  if (path.startsWith('/view/')) {
    route = 'view'
  }

  return [route, routes];
}

export function getRouteTo(route: Routes, params?: unknown[]): string {
  switch (route) {
    case 'view':
      const malId = params?.[1] as number | undefined;
      if (malId === undefined) {
        return '#';
      }
      return `#/view/${malId}`;
    default:
      return `#`;
  }
}

export function gotoRoute(route: Routes, params?: unknown[]) {
  const routeUrl = getRouteTo(route, params);
  location.hash = routeUrl;
}