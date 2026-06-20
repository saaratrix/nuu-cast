type PopoverPlacement = 'bottom' | 'right' | 'left';

const popover = document.createElement('div');
popover.id = 'item-popover';
popover.hidden = true;

const arrow = document.createElement('div');
arrow.className = 'item-popover-arrow';

const content = document.createElement('div');
content.className = 'item-popover-content';

popover.append(arrow, content);
document.body.appendChild(popover);

export function showPopover(anchor: HTMLElement) {
  const source = anchor.querySelector('.item-synopsis');
  if (!source) return;

  content.innerHTML = '';

  const clonedSource = source.cloneNode(true) as HTMLElement;
  clonedSource.hidden = false;
  content.append(clonedSource);

  popover.hidden = false;

  const a = anchor.getBoundingClientRect();
  const p = popover.getBoundingClientRect();

  const margin = 12;
  const gap = 12;

  let placement: PopoverPlacement = 'bottom';

  let left = a.left + a.width / 2 - p.width / 2;
  let top = a.bottom + gap;

  const fitsBottom =
    top + p.height <= window.innerHeight - margin &&
    left >= margin &&
    left + p.width <= window.innerWidth - margin;

  if (!fitsBottom) {
    placement = 'right';
    left = a.right + gap;
    top = a.top + a.height / 2 - p.height / 2;

    const fitsRight =
      left + p.width <= window.innerWidth - margin &&
      top >= margin &&
      top + p.height <= window.innerHeight - margin;

    if (!fitsRight) {
      placement = 'left';
      left = a.left - p.width - gap;
      top = a.top + a.height / 2 - p.height / 2;
    }
  }

  left = clamp(left, margin, window.innerWidth - p.width - margin);
  top = clamp(top, margin, window.innerHeight - p.height - margin);

  popover.dataset['placement'] = placement;

  popover.style.left = `${left + window.scrollX}px`;
  popover.style.top = `${top + window.scrollY}px`;

  positionArrow(anchor, left, top, placement);
}

export function hidePopover() {
  popover.hidden = true;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function positionArrow(
  anchor: HTMLElement,
  popoverLeft: number,
  popoverTop: number,
  placement: PopoverPlacement
) {
  const a = anchor.getBoundingClientRect();

  arrow.style.left = '';
  arrow.style.top = '';
  arrow.style.right = '';
  arrow.style.bottom = '';

  if (placement === 'bottom') {
    const anchorCenterX = a.left + a.width / 2;
    const arrowLeft = anchorCenterX - popoverLeft;

    arrow.style.left = `${arrowLeft}px`;
  } else {
    const anchorCenterY = a.top + a.height / 2;
    const arrowTop = anchorCenterY - popoverTop;

    arrow.style.top = `${arrowTop}px`;
  }
}