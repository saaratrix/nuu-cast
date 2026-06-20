import { MediaType, viewingFailedToLoadEvent, viewingItemChangedEvent, defaultControlsPlacement, ControlsPlacements, controlsPlacementValues } from './media-viewer-models.js';
import './media-viewer-controls-rotate.js';
export class MediaViewerControls extends HTMLElement {
    constructor() {
        super();
        this.activeFeatures = new Set();
        this._mediaViewer = null;
        this._viewerControls = null;
        this.onViewingItemChanged = (e) => {
            const event = e;
            if (event.detail.mediaViewer !== this.mediaViewer) {
                return;
            }
            this.setFeatures();
            this.updateView();
        };
        this.onViewingFailedToLoad = (e) => {
            const event = e;
            if (event.detail.mediaViewer !== this.mediaViewer) {
                return;
            }
            this.activeFeatures = new Set();
            this.updateView();
        };
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = `
      <style>
        .placement-page-left, .placement-page-right {
            position: fixed; top: 0;
        }
        .placement-item-left, .placement-item-right {
            position: absolute; top: 0.5rem;
        }
        
        .placement-page-right .features, .placement-item-right .features {
            justify-content: flex-end;
        }
      
        .controls {
          left: 0.5rem;
          height: 55px;
          width: calc(100% - 2rem);
          
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 0.5rem;
          
          opacity: 0.1;
          transition: opacity 100ms ease-in;
        }
        
        .controls:hover {
          opacity: 0.7
        }
        
        .features {
          display: flex;
        }
        
        .extra-space {
          width: 100%;
          height: 15px;
        }
        
      </style>
      <div class="controls">
          <div class="features"></div>
          <div class="extra-space"></div>
      </div>
    `;
    }
    get placement() {
        return this.getAttribute('placement');
    }
    set placement(value) {
        value = value === null || value === void 0 ? void 0 : value.toLowerCase();
        if (!controlsPlacementValues.has(value)) {
            value = defaultControlsPlacement;
        }
        const oldValue = this.placement;
        if (oldValue === value) {
            return;
        }
        this.setAttribute('placement', value);
        const oldClass = this.getClassNameForPlacement(oldValue);
        const newClass = this.getClassNameForPlacement(value);
        oldClass && this.viewerControls.classList.remove(oldClass);
        this.viewerControls.classList.add(newClass);
    }
    get mediaViewer() {
        if (!this._mediaViewer) {
            const rootNode = this.getRootNode();
            this._mediaViewer = rootNode.host;
        }
        return this._mediaViewer;
    }
    get viewerControls() {
        if (!this._viewerControls) {
            this._viewerControls = this.shadow.querySelector('.controls');
        }
        return this._viewerControls;
    }
    getClassNameForPlacement(placement) {
        switch (placement) {
            case ControlsPlacements.PageLeft:
                return 'placement-page-left';
            case ControlsPlacements.PageRight:
                return 'placement-page-right';
            case ControlsPlacements.ItemLeft:
                return 'placement-item-left';
            case ControlsPlacements.ItemRight:
                return 'placement-item-right';
        }
        return '';
    }
    updateView() {
        const allFeatures = [
            this.activeFeatures.has('video:audio') && `<media-viewer-controls-audio ></media-viewer-controls-audio>`,
            this.activeFeatures.has('video:progress') && `<media-viewer-controls-progress ></media-viewer-controls-progress>`,
            this.activeFeatures.has('video:fullscreen') && `<media-viewer-controls-fullscreen ></media-viewer-controls-fullscreen>`,
            this.activeFeatures.has('rotate') && `<media-viewer-controls-rotate ></media-viewer-controls-rotate>`,
        ];
        const activeFeatures = allFeatures.filter(f => typeof f === 'string');
        this.featuresElement.innerHTML = activeFeatures.join('\n');
    }
    connectedCallback() {
        this.featuresElement = this.shadow.querySelector('.features');
        if (!this.featuresElement) {
            throw new Error("Viewer Controls failed to initialize, bad bad!");
        }
        window.addEventListener(viewingItemChangedEvent, this.onViewingItemChanged);
        window.addEventListener(viewingFailedToLoadEvent, this.onViewingFailedToLoad);
        this.setFeatures();
        this.updateView();
    }
    disconnectedCallback() {
        window.removeEventListener(viewingItemChangedEvent, this.onViewingItemChanged);
        window.removeEventListener(viewingFailedToLoadEvent, this.onViewingFailedToLoad);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
    }
    setFeatures() {
        const features = [];
        switch (this.mediaViewer.activeMediaType) {
            case MediaType.Video:
                features.push('video:audio', 'video:fullscreen', 'video:progress');
                features.push('rotate');
                break;
            case MediaType.Image:
                features.push('rotate');
                break;
            default:
                break;
        }
        this.activeFeatures = new Set(features);
    }
}
MediaViewerControls.observedAttributes = ['placement'];
customElements.define('media-viewer-controls', MediaViewerControls);
