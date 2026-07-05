const loadedModules = new Set<string>();

export type StaticModule = 'crunchyroll';

export const staticModuleFiles: Record<StaticModule, string[]> = {
  'crunchyroll': ['/static/modules/static/crunchyroll.js'],
} as const;

export async function loadModules(type: StaticModule | string ): Promise<boolean> {
  if (loadedModules.has(type)) {
    return true;
  }

  if (staticModuleFiles[type as StaticModule]) {
    return loadStaticModules(type as StaticModule);
  }

  loadedModules.add(type);
  const request = await fetch(`/module/${type}`, {
    method: 'GET',
  });

  if (request.status !== 200) {
    loadedModules.delete(type);
    console.log(`Failed to load module ${type}`, request);
    return false;
  }
  const resources: string[] = await request.json() as string[];
  for (const resource of resources) {
    loadModuleResource(resource);
  }

  return true;
}

async function loadStaticModules(type: StaticModule): Promise<boolean> {
  if (loadedModules.has(type)) {
    return true;
  }

  const resources = staticModuleFiles[type];
  for (const resource of resources) {
    loadModuleResource(resource);
  }

  return true;
}

function loadModuleResource(resource: string, parent: HTMLElement = document.body): void {
  let element: HTMLScriptElement | HTMLLinkElement | undefined;
  if (resource.endsWith('.js')) {
    element = document.createElement('script');
    element.src = resource;
    element.type = 'module';
  } else if (resource.endsWith('.css')) {
    element = document.createElement('link');
    element.href = resource;
    element.rel = 'stylesheet';
  }

  if (element) {
    parent.appendChild(element);
  }
}