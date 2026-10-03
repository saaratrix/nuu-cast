export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isNodeText(node: Node): node is Text {
  return node.nodeType == Node.TEXT_NODE;
}

export function isNodeElement(node: Node): node is Element {
  return node.nodeType == Node.ELEMENT_NODE;
}

/**
 * AniList and MAL sends HTML formatted text so things like <strong>, <br>, <i> but we don't trust em!
 */
export function getParsedSynopsisHTML(synopsis: string) {
  const doc = new DOMParser().parseFromString(synopsis, "text/html");

  const allowedTags = new Set(["I", "B", "EM", "STRONG", "BR"]);
  const fragment = document.createDocumentFragment();

  for (const child of doc.body.childNodes) {
    let node: Node | undefined;
    if (isNodeText(child)) {
        node = document.createTextNode(child.textContent);
    } else if (isNodeElement(child)) {
      if (allowedTags.has((child as Element).tagName)) {
        node = document.createElement(child.tagName);
        node.textContent = child.textContent;
      } else {
        node = document.createTextNode(child.textContent);
      }
    }

    if (node) {
      fragment.appendChild(node);
    }
  }

  const container = document.createElement('div');
  container.appendChild(fragment);

  return container.innerHTML;
}
