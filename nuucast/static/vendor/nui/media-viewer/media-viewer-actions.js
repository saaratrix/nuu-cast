import { isVideoElement } from './media-viewer-shared.js';
export class MediaViewerActions {
    constructor(controls) {
        this.controls = controls;
    }
    getVideoElement() {
        const video = this.controls.mediaViewer.getViewerContentElement();
        if (!isVideoElement(video)) {
            return null;
        }
        return video;
    }
    togglePlayback() {
        const video = this.getVideoElement();
        if (!video) {
            return;
        }
        if (video.paused) {
            void video.play();
        }
        else {
            video.pause();
        }
    }
    seekForwards() {
        const offset = Math.random() > 0.5 ? 6 : 7;
        this.seekOffset(offset);
    }
    seekBackwards() {
        const offset = Math.random() > 0.5 ? -6 : -7;
        this.seekOffset(offset);
    }
    seekOffset(offsetSeconds) {
        const video = this.getVideoElement();
        if (!video) {
            return;
        }
        const time = Math.min(Math.max(video.currentTime + offsetSeconds, 0), video.duration);
        if (video.fastSeek) {
            video.fastSeek(time);
        }
        else {
            video.currentTime = time;
        }
    }
    // *************************
    // Incomplete methods, but methods that will exist eventually, some day!
    toggleMute() {
        const video = this.getVideoElement();
        if (!video) {
            return;
        }
    }
    /**
     * Adjust volume by a delta value, volume = current + delta.
     */
    adjustVolume(delta) {
        const video = this.getVideoElement();
        if (!video) {
            return;
        }
    }
    toggleFullscreen() {
        const video = this.getVideoElement();
        if (!video) {
            return;
        }
    }
}
