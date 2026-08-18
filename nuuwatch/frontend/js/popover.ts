type PopoverPlacement = 'top' | 'bottom' | 'right' | 'left';

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

  const aRects = anchor.getBoundingClientRect();
  const pRects = popover.getBoundingClientRect();

  const margin = 12;
  const gap = 12;

  const fitsBelow = aRects.bottom + gap + pRects.height <= window.innerHeight - margin;
  const fitsAbove = aRects.top - gap - pRects.height >= gap;

  let top: number;
  let left: number = 0;

  let placement: PopoverPlacement = 'bottom';
  if (fitsBelow || fitsAbove) {
    if (fitsBelow) {
      placement = 'bottom';
      top = aRects.bottom + gap;
    } else {
      top = aRects.top - gap - pRects.height;
      placement = 'top';
    }

    left = Math.max((aRects.left + aRects.width / 2) - pRects.width / 2, margin);
    // 1000 - 990 = 10
    const rightDelta = (innerWidth - margin) - (left + pRects.width);
    if (rightDelta < 0 && left > margin) {
      left += rightDelta;
    }
  } else {
    const fitsRight = aRects.right + gap + pRects.width <= window.innerWidth - margin;
    const fitsLeft = aRects.left - gap - pRects.width >= margin;

    // If it fits right or doesn't fit left then default to right.
    if (fitsRight || !fitsLeft) {
      left = aRects.right + gap;
      placement = 'right';
    } else if (fitsLeft) {
      left = aRects.left - gap - pRects.width;
      placement = 'left';
    }
    top = Math.max((aRects.top + aRects.height / 2 - pRects.height / 2), margin);
  }

  popover.dataset['placement'] = placement;
  popover.style.left = `${left + window.scrollX}px`;
  popover.style.top = `${top + window.scrollY}px`;

  positionArrow(anchor, left, top, placement);
}

export function hidePopover() {
  popover.hidden = true;
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

  if (placement === 'bottom' || placement === 'top') {
    const anchorCenterX = a.left + a.width / 2;
    const arrowLeft = anchorCenterX - popoverLeft;

    arrow.style.left = `${arrowLeft}px`;
  } else {
    const anchorCenterY = a.top + a.height / 2;
    const arrowTop = Math.max(anchorCenterY - popoverTop, 12);
    arrow.style.top = `${arrowTop}px`;
  }
}