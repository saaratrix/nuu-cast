type Layout = 'home' | 'anime';
const layouts = new Map<Layout, string>();

export function loadHTML(layout: Layout, targetSelector?: string): Promise<string> {
  let promise: Promise<string>;

  if (layouts.has(layout)) {
    promise = Promise.resolve(layouts.get(layout)!);
  } else {
    promise = fetch(`/html/${layout}`, {
      method: 'GET',
    }).then((response) => {
      if (!response.ok) {
        console.log(`Failed response for ${layout}`, response);
        throw new Error(`Failed to load html for ${layout}`);
      }
      return response.text();
    });
  }

  return promise.then(html => tryAddHtmlToTarget(layout, html, targetSelector));
}

function tryAddHtmlToTarget(layout: Layout, html: string, targetSelector?: string) {
  if (!targetSelector) {
    return html;
  }

  const targetContainer = document.querySelector(targetSelector);
  if (!targetContainer) {
    throw new Error(`Can't find target container '${targetContainer}', can't load ${layout} page`);
  }

  targetContainer.innerHTML = html;
  return html;
}