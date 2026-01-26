/**
 * ComposerResizer - Manages resizing of the composer/textarea
 * Allows users to drag a resizer handle to adjust composer height
 */
export class ComposerResizer {
  constructor(composer, resizer, handleTextareaResize, minHeight = 72) {
    this.composer = composer;
    this.resizer = resizer;
    this.handleTextareaResize = handleTextareaResize;
    this.minHeight = minHeight;
    this.isResizing = false;
    this.startY = 0;
    this.startHeight = 0;
  }

  /**
   * Initialize the resizer with event listeners
   */
  initialize() {
    if (!this.composer || !this.resizer) return;

    // Set initial height
    this.composer.style.height = `${this.minHeight}px`;
    this.composer.dataset.resized = 'true';
    requestAnimationFrame(() => this.handleTextareaResize());

    // Setup event listeners
    this.resizer.addEventListener('pointerdown', (e) => this.startResize(e));
    this.resizer.addEventListener('pointermove', (e) => this.handleMove(e));
    this.resizer.addEventListener('pointerup', (e) => this.stopResize(e));
    this.resizer.addEventListener('pointercancel', (e) => this.stopResize(e));
  }

  /**
   * Get minimum and maximum height bounds
   */
  getBounds() {
    const minHeight = this.minHeight;
    const maxHeight = Math.max(minHeight, Math.floor(window.innerHeight * 0.6));
    return { minHeight, maxHeight };
  }

  /**
   * Start resize operation
   */
  startResize(event) {
    event.preventDefault();
    this.isResizing = true;
    this.startY = event.clientY;
    this.startHeight = this.composer.getBoundingClientRect().height;
    this.resizer.setPointerCapture(event.pointerId);
    document.body.style.cursor = 'ns-resize';
  }

  /**
   * Handle pointer movement during resize
   */
  handleMove(event) {
    if (!this.isResizing) return;

    const delta = this.startY - event.clientY;
    const { minHeight, maxHeight } = this.getBounds();
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, this.startHeight + delta));

    this.composer.style.height = `${nextHeight}px`;
    this.composer.dataset.resized = 'true';
    this.handleTextareaResize();
  }

  /**
   * Stop resize operation
   */
  stopResize(event) {
    if (!this.isResizing) return;

    this.isResizing = false;
    document.body.style.cursor = '';

    if (this.resizer.hasPointerCapture(event.pointerId)) {
      this.resizer.releasePointerCapture(event.pointerId);
    }
  }
}
