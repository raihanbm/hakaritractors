/*!
 * Hikari DiagramPdfViewer — PDF.js canvas renderer with configurable visual crop
 * Shared between Internal Hikari (React) and Storefront (vanilla JS).
 * Original PDF file is never modified. Crop is visual-only at the presentation layer.
 */
(function (global) {
  'use strict';

  const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';

  const DEFAULT_CROP = { topRatio: 0, rightRatio: 0, bottomRatio: 0, leftRatio: 0 };

  let pdfjsLib = null;
  let pdfjsLoading = null;

  function loadPdfJs() {
    if (pdfjsLib) return Promise.resolve(pdfjsLib);
    if (pdfjsLoading) return pdfjsLoading;
    pdfjsLoading = import(PDFJS_CDN).then(function (mod) {
      pdfjsLib = mod;
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      }
      return pdfjsLib;
    }).catch(function (err) {
      pdfjsLoading = null;
      throw err;
    });
    return pdfjsLoading;
  }

  /**
   * @param {Object} options
   * @param {string} options.container — DOM element or selector where viewer mounts
   * @param {string} options.pdfUrl — URL of the source PDF
   * @param {Object} [options.crop] — { topRatio, rightRatio, bottomRatio, leftRatio } 0–0.5
   * @param {boolean} [options.showCropControls=false]
   * @param {Function} [options.onCropChange] — called with new crop config
   * @param {Function} [options.onResetCrop] — called when reset is requested
   * @param {Function} [options.onError] — called with Error
   */
  function DiagramPdfViewer(options) {
    if (!(this instanceof DiagramPdfViewer)) return new DiagramPdfViewer(options);
    options = options || {};

    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) throw new Error('DiagramPdfViewer: container is required');

    this.pdfUrl = options.pdfUrl || '';
    this.crop = Object.assign({}, DEFAULT_CROP, options.crop || {});
    this.showCropControls = !!options.showCropControls;
    this.onCropChange = options.onCropChange || null;
    this.onResetCrop = options.onResetCrop || null;
    this.onError = options.onError || null;

    this._pdfDoc = null;
    this._currentPage = 1;
    this._totalPages = 0;
    this._zoom = 1;
    this._canvasEl = null;
    this._rendering = false;

    this._buildDom();
    if (this.pdfUrl) this.load(this.pdfUrl);
  }

  DiagramPdfViewer.prototype._buildDom = function () {
    var self = this;
    this.container.innerHTML = '';

    // Wrapper
    var wrap = document.createElement('div');
    wrap.className = 'hikari-pdf-viewer';
    wrap.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#f0f2f5;border-radius:10px;overflow:hidden;position:relative';

    // Canvas area
    var canvasArea = document.createElement('div');
    canvasArea.className = 'hikari-pdf-canvas-area';
    canvasArea.style.cssText = 'flex:1;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:0;position:relative;min-height:200px';

    var canvas = document.createElement('canvas');
    canvas.className = 'hikari-pdf-canvas';
    canvas.style.cssText = 'display:block;max-width:100%;box-shadow:0 1px 8px rgba(0,0,0,0.06)';
    this._canvasEl = canvas;
    canvasArea.appendChild(canvas);

    wrap.appendChild(canvasArea);

    // Toolbar
    var toolbar = document.createElement('div');
    toolbar.className = 'hikari-pdf-toolbar';
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:7px 12px;background:#fff;border-top:1px solid #e4e8ec;min-height:40px;font-size:11px;color:#3c444c;font-family:Inter,sans-serif';

    // Page nav
    var prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.title = 'Previous page';
    prevBtn.style.cssText = 'width:28px;height:28px;border:1px solid #dde2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;display:grid;place-items:center;color:#3c444c';
    prevBtn.onclick = function () { self.prevPage(); };

    var pageLabel = document.createElement('span');
    pageLabel.style.cssText = 'min-width:48px;text-align:center;font-weight:700;font-size:11px';
    pageLabel.textContent = '1 / 1';
    this._pageLabel = pageLabel;

    var nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.title = 'Next page';
    nextBtn.style.cssText = 'width:28px;height:28px;border:1px solid #dde2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;display:grid;place-items:center;color:#3c444c';
    nextBtn.onclick = function () { self.nextPage(); };

    this._prevBtn = prevBtn;
    this._nextBtn = nextBtn;

    toolbar.appendChild(prevBtn);
    toolbar.appendChild(pageLabel);
    toolbar.appendChild(nextBtn);

    // Separator
    var sep = document.createElement('span');
    sep.style.cssText = 'width:1px;height:18px;background:#e4e8ec;margin:0 4px';
    toolbar.appendChild(sep);

    // Zoom controls
    var zoomOut = document.createElement('button');
    zoomOut.textContent = '−';
    zoomOut.title = 'Zoom out';
    zoomOut.style.cssText = 'width:28px;height:28px;border:1px solid #dde2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;display:grid;place-items:center';
    zoomOut.onclick = function () { self.zoom(-0.15); };

    var zoomLabel = document.createElement('span');
    zoomLabel.textContent = '100%';
    zoomLabel.style.cssText = 'font-size:9.5px;font-weight:700;min-width:34px;text-align:center';
    this._zoomLabel = zoomLabel;

    var zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.title = 'Zoom in';
    zoomIn.style.cssText = 'width:28px;height:28px;border:1px solid #dde2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;display:grid;place-items:center';
    zoomIn.onclick = function () { self.zoom(0.15); };

    var zoomReset = document.createElement('button');
    zoomReset.textContent = '1:1';
    zoomReset.title = 'Reset zoom';
    zoomReset.style.cssText = 'width:28px;height:28px;border:1px solid #dde2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:10px;display:grid;place-items:center';
    zoomReset.onclick = function () { self.zoom(0, true); };

    toolbar.appendChild(zoomOut);
    toolbar.appendChild(zoomLabel);
    toolbar.appendChild(zoomIn);
    toolbar.appendChild(zoomReset);

    // Crop controls (admin only)
    if (this.showCropControls) {
      var sep2 = document.createElement('span');
      sep2.style.cssText = 'width:1px;height:18px;background:#e4e8ec;margin:0 4px';
      toolbar.appendChild(sep2);

      var cropLabel = document.createElement('span');
      cropLabel.textContent = 'Crop:';
      cropLabel.style.cssText = 'font-size:9.5px;color:#68717a;font-weight:600';
      toolbar.appendChild(cropLabel);

      var cropInput = document.createElement('input');
      cropInput.type = 'range';
      cropInput.min = '0';
      cropInput.max = '0.4';
      cropInput.step = '0.01';
      cropInput.value = String(this.crop.topRatio || 0);
      cropInput.style.cssText = 'width:80px;accent-color:#f15a24';
      var selfCrop = this;
      cropInput.oninput = function () {
        var val = parseFloat(this.value);
        selfCrop.crop.topRatio = val;
        selfCrop._cropVal.textContent = Math.round(val * 100) + '%';
        selfCrop._renderCurrentPage();
        if (selfCrop.onCropChange) selfCrop.onCropChange(selfCrop.crop);
      };
      toolbar.appendChild(cropInput);

      var cropVal = document.createElement('span');
      cropVal.textContent = Math.round((this.crop.topRatio || 0) * 100) + '%';
      cropVal.style.cssText = 'font-size:9.5px;font-weight:700;min-width:30px';
      this._cropVal = cropVal;
      toolbar.appendChild(cropVal);

      var resetCropBtn = document.createElement('button');
      resetCropBtn.textContent = 'Reset';
      resetCropBtn.title = 'Reset crop';
      resetCropBtn.style.cssText = 'height:28px;padding:0 8px;border:1px solid #dde2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:10px';
      resetCropBtn.onclick = function () {
        selfCrop.crop = Object.assign({}, DEFAULT_CROP);
        selfCrop._cropVal.textContent = '0%';
        cropInput.value = '0';
        selfCrop._renderCurrentPage();
        if (selfCrop.onResetCrop) selfCrop.onResetCrop();
      };
      toolbar.appendChild(resetCropBtn);
    }

    // View original PDF link (admin only)
    if (this.showCropControls) {
      var origLink = document.createElement('a');
      origLink.href = this.pdfUrl;
      origLink.target = '_blank';
      origLink.rel = 'noopener noreferrer';
      origLink.textContent = 'Original';
      origLink.title = 'View original PDF';
      origLink.style.cssText = 'margin-left:auto;font-size:9.5px;color:#f15a24;text-decoration:none;font-weight:700;padding:0 6px';
      this._origLink = origLink;
      toolbar.appendChild(origLink);
    }

    wrap.appendChild(toolbar);

    // Error state
    var errorEl = document.createElement('div');
    errorEl.className = 'hikari-pdf-error';
    errorEl.style.cssText = 'display:none;flex:1;align-items:center;justify-content:center;color:#c43b35;font-size:12px;padding:20px;text-align:center';
    this._errorEl = errorEl;
    wrap.appendChild(errorEl);

    this.container.appendChild(wrap);
  };

  DiagramPdfViewer.prototype.load = function (pdfUrl) {
    var self = this;
    this.pdfUrl = pdfUrl;
    if (this._origLink) this._origLink.href = pdfUrl;

    if (!pdfUrl) {
      this._showError('No PDF URL provided.');
      return Promise.reject(new Error('No PDF URL'));
    }

    return loadPdfJs().then(function () {
      return pdfjsLib.getDocument({ url: pdfUrl, cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/cmaps/', cMapPacked: true }).promise;
    }).then(function (doc) {
      self._pdfDoc = doc;
      self._totalPages = doc.numPages;
      self._currentPage = 1;
      self._zoom = 1;
      self._hideError();
      self._updateNav();
      return self._renderCurrentPage();
    }).catch(function (err) {
      self._showError('Failed to load PDF: ' + (err.message || 'Unknown error'));
      if (self.onError) self.onError(err);
      throw err;
    });
  };

  DiagramPdfViewer.prototype._renderCurrentPage = function () {
    var self = this;
    if (!this._pdfDoc || this._rendering) return Promise.resolve();
    this._rendering = true;

    return this._pdfDoc.getPage(this._currentPage).then(function (page) {
      var viewport = page.getViewport({ scale: 1 });
      var crop = self.crop || DEFAULT_CROP;

      // Calculate cropped dimensions
      var cropTopPx = viewport.height * (crop.topRatio || 0);
      var cropRightPx = viewport.width * (crop.rightRatio || 0);
      var cropBottomPx = viewport.height * (crop.bottomRatio || 0);
      var cropLeftPx = viewport.width * (crop.leftRatio || 0);

      var croppedWidth = viewport.width - cropLeftPx - cropRightPx;
      var croppedHeight = viewport.height - cropTopPx - cropBottomPx;

      // Determine scale to fit container width
      var containerWidth = self.container.clientWidth - 4;
      var scale = Math.min(containerWidth / croppedWidth, 1.8) * self._zoom;
      var outputWidth = Math.floor(croppedWidth * scale);
      var outputHeight = Math.floor(croppedHeight * scale);

      var canvas = self._canvasEl;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      canvas.style.width = outputWidth + 'px';
      canvas.style.height = outputHeight + 'px';

      var ctx = canvas.getContext('2d');

      // Render the page at the correct scale, then clip to cropped area
      var renderViewport = page.getViewport({ scale: scale });

      // Use transform to show only the cropped portion
      ctx.save();
      ctx.translate(-cropLeftPx * scale, -cropTopPx * scale);

      return page.render({ canvasContext: ctx, viewport: renderViewport }).promise.then(function () {
        ctx.restore();
        self._rendering = false;
        self._updateNav();
      });
    }).catch(function (err) {
      self._rendering = false;
      self._showError('Render failed: ' + (err.message || 'Unknown'));
      throw err;
    });
  };

  DiagramPdfViewer.prototype._updateNav = function () {
    if (this._pageLabel) {
      this._pageLabel.textContent = this._currentPage + ' / ' + this._totalPages;
    }
    if (this._prevBtn) this._prevBtn.disabled = this._currentPage <= 1;
    if (this._nextBtn) this._nextBtn.disabled = this._currentPage >= this._totalPages;
    if (this._zoomLabel) {
      this._zoomLabel.textContent = Math.round(this._zoom * 100) + '%';
    }
  };

  DiagramPdfViewer.prototype.nextPage = function () {
    if (this._currentPage < this._totalPages) {
      this._currentPage++;
      this._renderCurrentPage();
    }
  };

  DiagramPdfViewer.prototype.prevPage = function () {
    if (this._currentPage > 1) {
      this._currentPage--;
      this._renderCurrentPage();
    }
  };

  DiagramPdfViewer.prototype.zoom = function (delta, reset) {
    if (reset) {
      this._zoom = 1;
    } else {
      this._zoom = Math.max(0.3, Math.min(3, this._zoom + delta));
    }
    this._renderCurrentPage();
  };

  DiagramPdfViewer.prototype._showError = function (msg) {
    if (this._errorEl) {
      this._errorEl.style.display = 'flex';
      this._errorEl.textContent = msg;
    }
    if (this._canvasEl) this._canvasEl.style.display = 'none';
  };

  DiagramPdfViewer.prototype._hideError = function () {
    if (this._errorEl) this._errorEl.style.display = 'none';
    if (this._canvasEl) this._canvasEl.style.display = 'block';
  };

  DiagramPdfViewer.prototype.destroy = function () {
    if (this._pdfDoc) {
      this._pdfDoc.destroy();
      this._pdfDoc = null;
    }
    if (this.container) this.container.innerHTML = '';
  };

  // Export
  global.HikariDiagramPdfViewer = DiagramPdfViewer;

})(typeof window !== 'undefined' ? window : globalThis);
