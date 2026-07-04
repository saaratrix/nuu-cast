const loadedModules = new Set<string>();

export async function loadModules(type: string): Promise<boolean> {
  if (loadedModules.has(type)) {
    return true;
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
      document.body.appendChild(element);
    }
  };

  return true;
}