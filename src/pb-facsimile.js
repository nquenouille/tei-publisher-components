import { LitElement, html, css } from 'lit-element';
import "@lrnwebcomponents/es-global-bridge";
import { pbMixin } from './pb-mixin.js';
import { resolveURL } from './utils.js';

/**
 * View zoomable images using a IIIF server.
 *
 * @fires pb-start-update - When received, resets the facsimile viewer
 * @fires pb-update - Checks the contents received for pb-facs-links
 * @fires pb-show-annotation - When received, sets up the viewer to select a particular image and highlight coordinates
 * 
 * @cssprop --pb-facsimile-height - Height of the `pb-facsimile` component in px
 * @cssprop --pb-facsimile-border - Style for the annotation highlight border
 * 
 * @slot before - use for content which should be shown above the facsimile viewer
 * @slot after - use for content which should be shown below the facsimile viewer
 */
export class PbFacsimile extends pbMixin(LitElement) {
    static get properties() {
        return {
            ...super.properties,
            // Image source
            src: {
                type: String
            },
            /**
             * Set to false to prevent the appearance of the default navigation controls.
             * Note that if set to false, the customs buttons set by the options
             * zoomInButton, zoomOutButton etc, are rendered inactive.
             */
            showNavigationControl: {
                type: Boolean,
                attribute: 'show-navigation-control'
            },
            // Set to true to make the navigator minimap appear.
            showNavigator: {
                type: Boolean,
                attribute: 'show-navigator'
            },
            /** If true then the 'Go home' button is displayed to go back to the original zoom and pan. */
            showHomeControl: {
                type: Boolean,
                attribute: 'show-home-control'
            },
            /** If true then the 'Toggle full page' button is displayed to switch between full page and normal mode. */
            showFullPageControl: {
                type: Boolean,
                attribute: 'show-full-page-control'
            },
            /**
             * Default zoom between: set to 0 to adjust to viewer size.
             */
            defaultZoomLevel: {
                type: Number,
                attribute: 'default-zoom-level'
            },
            /**
             * If true then the rotate left/right controls will be displayed
             * as part of the standard controls. This is also subject to the
             * browser support for rotate (e.g. viewer.drawer.canRotate()).
             */
            showRotationControl: {
                type: Boolean,
                attribute: 'show-rotation-control'
            },
            // Constrain during pan
            constrainDuringPan: {
                type: Boolean,
                attribute: 'contrain-during-pan'
            },
            /**
             *  The percentage ( as a number from 0 to 1 ) of the source image
             * which must be kept within the viewport.
             * If the image is dragged beyond that limit, it will 'bounce'
             * back until the minimum visibility ratio is achieved.
             * Setting this to 0 and wrapHorizontal ( or wrapVertical )
             * to true will provide the effect of an infinitely scrolling viewport.
             */
            visibilityRatio: {
                type: Number,
                attribute: 'visibility-ratio'
            },
            /**
             * Type of the source of the image to display: either 'iiif' or 'image'
             * (for simple image links not served via IIIF).
             */
            type: {
                type: String
            },
            baseUri: {
                type: String,
                attribute: 'base-uri'
            },
            /**
             * Path pointing to the location of openseadragon user interface images.
             */
            prefixUrl: {
                type: String,
                attribute: 'prefix-url'
            },
            /**
             * Array of facsimiles
             *
             */
            facsimiles: {
                type: Array
            },
            /**
             * Will be true if images were loaded for display, false if there are no images
             * to show.
             */
            loaded: {
                type: Boolean,
                reflect: true
            }
        };
    }

    constructor() {
        super();
        this._facsimiles = [];
        this.baseUri = '';
        this.type = 'iiif';
        this.visibilityRatio = 1;
        this.defaultZoomLevel = 0;
        this.showHomeControl = false;
        this.showNavigator = false;
        this.showNavigationControl = false;
        this.showFullPageControl = false;
        this.showRotationControl = false;
        this.constrainDuringPan = false;
        this.src = '';
        this.prefixUrl = '../images/openseadragon/';
        this.loaded = false;
    }

    set facsimiles(facs) {
        this._facsimiles = facs || [];
        this.loaded = this._facsimiles.length > 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this.subscribeTo('pb-start-update', this._clearAll.bind(this));
        this.subscribeTo('pb-update', this._fragmentUpdateListener.bind(this));
        this.subscribeTo('pb-show-annotation', this._showAnnotationListener.bind(this));
    }

    firstUpdated() {
        window.ESGlobalBridge.requestAvailability();
        const path = resolveURL('../lib/openseadragon.min.js');
        window.ESGlobalBridge.instance.load("openseadragon", path);
        window.addEventListener(
            "es-bridge-openseadragon-loaded",
            this._initOpenSeadragon.bind(this),
            { once: true }
        );
    }

    render() {
        return html`
            <div class="content">
                <slot name="before"></slot>
                <!-- Openseadragon -->
                <div id="viewer"></div>
                <slot name="after"></slot>
            </div>
        `;
    }

    static get styles() {
        return css`
            :host {
                position: relative;
                background: transparent;
            }

            #runtime-overlay {
                border: var(--pb-facsimile-border, 4px solid rgba(0, 0, 128, 0.5));
            }

            #viewer {
                position: relative;
                height: var(--pb-facsimile-height, 500px);
                width: 100%;
            }
        `;
    }

    // Init openseadragon
    _initOpenSeadragon() {
        const prefixUrl = resolveURL(this.prefixUrl + (this.prefixUrl.endsWith("/") ? "" : "/"));
        this.viewer = OpenSeadragon({
            element: this.shadowRoot.getElementById('viewer'),
            prefixUrl,
            preserveViewport: true,
            sequenceMode: true,
            showZoomControl: true,
            showHomeControl: this.showHomeControl,
            showFullPageControl: this.showFullPageControl,
            showNavigator: this.showNavigator,
            showNavigationControl: this.showNavigationControl,
            showRotationControl: this.showRotationControl,
            autoHideControls: false,
            visibilityRatio: 1,
            minZoomLevel: 1,
            defaultZoomLevel: this.defaultZoomLevel,
            constrainDuringPan: true
        });

        this.viewer.addHandler('open', this.resetZoom.bind(this));
        this.viewer.addHandler('open-failed', (ev) => {
            console.error('<pb-facsimile> open failed: %s', ev.message);
            this.loaded = false;
        });
        this._facsimileObserver();

        this.signalReady();
    }

    _facsimileObserver() {
        if (!this.viewer) {
            return;
        }
        if (this._facsimiles.length === 0) { return this.viewer.close() }
        const uris = this._facsimiles.map(fac => {
            if (this.type === 'iiif') {
                return `${this.baseUri}${fac}/info.json`;
            } else {
                return {
                    tileSource: {
                        type: 'image',
                        url: `${this.baseUri}${fac}`,
                        buildPyramid: false
                    }
                }
            }
        });

        this.viewer.open(uris)
        this.viewer.goToPage(0)
    }

    _clearAll() {
        if (!this.viewer) {
            return;
        }
        this.resetZoom();
        this.viewer.clearOverlays();
        this.facsimiles = [];
    }

    _fragmentUpdateListener(event) {
        this.facsimiles = this._getFacsimilesFromData(event.detail.root)
        this._facsimileObserver();
    }

    _getFacsimilesFromData(elem) {
        const facsimiles = [];
        elem.querySelectorAll('pb-facs-link').forEach(cb => {
            if (cb.facs) {
                facsimiles.push(cb.facs);
            }
        });
        console.log('<pb-facsimile> _getFacsimilesFromData', facsimiles);
        return facsimiles;
    }

    _showAnnotationListener(event) {
        if (!this.viewer) {
            return;
        }
        const overlayId = 'runtime-overlay'

        // remove old overlay
        this.viewer.removeOverlay(this.overlay);

        // check event data for completeness
        if (!event.detail.file || event.detail.file === 0) {
            return console.error('file missing', event.detail)
        }

        if (
            event.detail.coordinates &&
            (!event.detail.coordinates[0] ||
                event.detail.coordinates.length !== 4)
        ) {
            return console.error('coords incomplete or missing', event.detail)
        }

        // find page to show
        const page = this._pageIndexByUrl(event.detail.file)

        if (page < 0) {
            return console.error('page not found', event.detail)
        }

        if (this.viewer.currentPage() !== page) {
            this.viewer.goToPage(page);
        }

        if (event.detail.coordinates) {
            // deconstruct given coordinates into variables
            const [x1, y1, w, h] = event.detail.coordinates;

            const currentRect = this.viewer.viewport.viewportToImageRectangle(
                this.viewer.viewport.getBounds(true));

            // scroll into view?
            if (!currentRect.containsPoint(new OpenSeadragon.Point(x1, y1))) {
                this.viewer.viewport.fitBoundsWithConstraints(
                    this.viewer.viewport.imageToViewportRectangle(x1, y1, currentRect.width, currentRect.height));
            }

            // create new overlay
            const overlay = this.overlay = document.createElement('div');
            overlay.id = overlayId;

            // place marker
            const marker = this.viewer.viewport.imageToViewportRectangle(x1, y1, w, h);

            this.viewer.addOverlay({
                element: overlay,
                location: marker
            });
        }
    }

    _pageIndexByUrl(file) {
        return this._facsimiles.indexOf(file);
    }

    // reset zoom
    resetZoom() {
        if (!this.viewer) {
            return;
        }
        this.viewer.viewport.goHome();
    }


}
customElements.define('pb-facsimile', PbFacsimile);