'use client';

import { useEffect, useRef, useState } from 'react';
import { geoMercator, geoPath, geoCentroid, geoBounds, type GeoGeometryObjects } from 'd3-geo';
import { select } from 'd3-selection';
import { easeLinear } from 'd3-ease';
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { interpolate as interpolateNumber } from 'd3-interpolate';
import 'd3-transition';
import { MapPin, RotateCcw, Compass } from 'lucide-react';
import { DISTRICT_CVR_DATA, DEFAULT_DISTRICT_CVR } from '@/lib/districtCvrData';
import { SOCO_LOCATIONS, SOCO_LOCATION_DATA } from '@/lib/socoLocationData';
import { DISTRICT_COLORS, DEFAULT_DISTRICT_COLOR } from '@/lib/districtColors';
import DistrictDetailPanel from '@/components/dashboard/DistrictDetailPanel';

interface DistrictFeature {
  type: 'Feature';
  properties: { district: string; iso: string };
  geometry: GeoGeometryObjects;
}

interface DistrictGeoJSON {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}

const WIDTH = 320;
const HEIGHT = 700;
const MIN_SCALE = 1;
const MAX_SCALE = 8;

const PIN_FILL = '#dc2626';
const PIN_FILL_HOVER = '#7f1d1d';
/** Zoom level applied when a single SOCO location pin is clicked. */
const LOCATION_ZOOM = 5;
/** Pin size in screen pixels — counter-scaled so pins never grow with zoom. */
const PIN_SCALE = 0.85;

type SelectionKind = 'district' | 'location';
type ViewMode = 'all' | 'districts' | 'locations';

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'districts', label: 'Districts' },
  { value: 'locations', label: 'SOCO Locations' },
];

interface Selection {
  kind: SelectionKind;
  /** District name, or SOCO location name. */
  name: string;
}

interface HoverInfo {
  kind: SelectionKind;
  name: string;
  screenX: number;
  screenY: number;
}

// Manual label offsets (in map units, before zoom scaling) for districts
// whose geographic centroid sits too close to a neighbor's border, causing
// the name to overlap that border/neighbor at low zoom.
const LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  Ampara: { dx: 16, dy: -4 },
  Matale: { dx: -4, dy: 8 },
  'Nuwara Eliya': { dx: -1, dy: 5 },
  Kegalle: { dx: 0, dy: -6 },
  Badulla: { dx: 2 , dy: 10 },
  Kandy: { dx: -2, dy: 0 },
  Vavuniya: { dx: -6, dy: 10 },
  Trincomalee: { dx: 6, dy: 20 },
  Puttalam: { dx: 0, dy: 10 },
  Batticaloa: { dx: -8, dy: 0 },
  Monaragala: { dx: 8, dy: 0 },
  Hambantota: { dx: -10, dy: 10 },
  Kilinochchi: { dx: 0, dy: 4 },
};

const MULTILINE_LABELS: Record<string, string[]> = {
  'Nuwara Eliya': ['Nuwara', 'Eliya'],
};

export default function DistrictMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [geoData, setGeoData] = useState<DistrictGeoJSON | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('districts');
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    let cancelled = false;
    fetch('/data/sri-lanka-districts.geojson')
      .then((res) => res.json())
      .then((data: DistrictGeoJSON) => {
        if (!cancelled) setGeoData(data);
      })
      .catch((err) => console.error('Failed to load district map data', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const projection = geoData
    ? geoMercator().fitSize([WIDTH, HEIGHT], geoData as unknown as GeoJSON.GeoJSON)
    : null;
  const pathGenerator = projection ? geoPath(projection) : null;

  // Set up d3-zoom (scroll-wheel / pinch / drag) once the SVG is mounted.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      // Block d3's own wheel/mousedown handling entirely — wheel zoom is
      // driven manually below (always anchored to the fixed map center), and
      // drag-to-pan is disabled so the map can never drift off-center.
      .filter((event: Event) => {
        if (event.type === 'wheel' || event.type === 'mousedown') return false;
        if (event.type.startsWith('touch')) return true;
        return false;
      })
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { x, y, k } = event.transform;
        setTransform({ x, y, k });
      });

    const selection = select(svg);
    selection.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Wheel zoom, anchored to the fixed map center (WIDTH/2, HEIGHT/2)
    // regardless of cursor position, so scrolling near an empty edge never
    // drags the landmass off-screen (there's no drag-to-pan to recover with).
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      const zoomFactor = Math.pow(2, -event.deltaY * 0.002);
      const nextK = Math.max(MIN_SCALE, Math.min(MAX_SCALE, current.k * zoomFactor));
      if (nextK === current.k) return;

      const focalX = (WIDTH / 2 - current.x) / current.k;
      const focalY = (HEIGHT / 2 - current.y) / current.k;
      const nextTransform = zoomIdentity
        .translate(WIDTH / 2 - focalX * nextK, HEIGHT / 2 - focalY * nextK)
        .scale(nextK);

      zoomBehavior.transform(selection, nextTransform);
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });

    // Drag panning in both directions, clamped so the scaled content always
    // still covers the viewport: at scale k, content covers [t, t + k*SIZE]
    // against a viewport of [0, SIZE], so t must stay within
    // [SIZE*(1-k), 0] for each axis. This range grows with zoom, which is
    // what lets the far edges be reached at high zoom — a fixed pixel clamp
    // (the previous approach) was too small once k grew and made the map
    // edges unreachable when zoomed in.
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let transformStartX = 0;
    let transformStartY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      const current = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      transformStartX = current.x;
      transformStartY = current.y;
      svg.style.cursor = 'grabbing';
    };

    const handleMouseMoveDrag = (event: MouseEvent) => {
      if (!isDragging) return;
      const current = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      const minX = WIDTH * (1 - current.k);
      const minY = HEIGHT * (1 - current.k);
      const nextX = Math.max(minX, Math.min(0, transformStartX + deltaX));
      const nextY = Math.max(minY, Math.min(0, transformStartY + deltaY));
      const nextTransform = zoomIdentity.translate(nextX, nextY).scale(current.k);
      zoomBehavior.transform(selection, nextTransform);
    };

    const handleMouseUp = () => {
      isDragging = false;
      svg.style.cursor = '';
    };

    svg.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMoveDrag);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      select(svg).on('.zoom', null);
      svg.removeEventListener('wheel', handleWheel);
      svg.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMoveDrag);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [geoData]);

  const animateTo = (x: number, y: number, k: number) => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;

    const selection = select(svg);
    const start: ZoomTransform = (selection.node() as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;

    // Keep the same screen point fixed under the cursor/target throughout by
    // interpolating the focal point (in world space) and scale (in log space)
    // separately, then re-deriving translate each frame. Log-space scale keeps
    // the zoom-in/out feeling constant-paced instead of slow-then-fast.
    const startFocalX = (WIDTH / 2 - start.x) / start.k;
    const startFocalY = (HEIGHT / 2 - start.y) / start.k;
    const endFocalX = (WIDTH / 2 - x) / k;
    const endFocalY = (HEIGHT / 2 - y) / k;

    const logInterpolate = interpolateNumber(Math.log(start.k), Math.log(k));
    const focalXInterpolate = interpolateNumber(startFocalX, endFocalX);
    const focalYInterpolate = interpolateNumber(startFocalY, endFocalY);

    selection
      .transition()
      .duration(750)
      .ease(easeLinear)
      .tween('zoom', function () {
        const node = this as SVGSVGElement & { __zoom?: ZoomTransform };
        return (t: number) => {
          const nextK = Math.exp(logInterpolate(t));
          const nextFocalX = focalXInterpolate(t);
          const nextFocalY = focalYInterpolate(t);
          const nextTransform = zoomIdentity
            .translate(WIDTH / 2 - nextFocalX * nextK, HEIGHT / 2 - nextFocalY * nextK)
            .scale(nextK);
          // Write __zoom directly and re-emit through the zoom behavior's event
          // pipeline without calling zoomBehavior.transform(), which would
          // interrupt() this very transition on every tick and cut it short.
          node.__zoom = nextTransform;
          setTransform({ x: nextTransform.x, y: nextTransform.y, k: nextTransform.k });
        };
      });
  };

  // Same bound as the drag clamp: at scale k, a translate on an axis of the
  // given size must stay within [size*(1-k), 0] for the scaled content to
  // still cover the viewport on that axis.
  const clampPan = (t: number, k: number, size: number) => Math.max(size * (1 - k), Math.min(0, t));

  const handleDistrictClick = (feature: DistrictFeature) => {
    // In the "SOCO Locations" filter the map is scoped to pins only — a
    // district click should neither zoom nor open the district's panel.
    if (viewMode === 'locations') return;

    const districtName = feature.properties.district;
    const isReselect = selection?.kind === 'district' && selection.name === districtName;

    if (isReselect) {
      animateTo(0, 0, 1);
      setSelection(null);
      return;
    }

    if (!projection) return;
    const bounds = geoBounds(feature as unknown as GeoJSON.GeoJSON);
    const centroid = geoCentroid(feature as unknown as GeoJSON.GeoJSON);

    const [[x0, y0], [x1, y1]] = [projection(bounds[0])!, projection(bounds[1])!];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y0 - y1);
    const projectedCentroid = projection(centroid);
    if (!projectedCentroid) return;
    const [cx, cy] = projectedCentroid;

    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, 0.8 / Math.max(dx / WIDTH, dy / HEIGHT)));
    const translateX = clampPan(WIDTH / 2 - scale * cx, scale, WIDTH);
    const translateY = clampPan(HEIGHT / 2 - scale * cy, scale, HEIGHT);

    animateTo(translateX, translateY, scale);
    setSelection({ kind: 'district', name: districtName });
    setHover(null);
  };

  const handleLocationClick = (locationName: string) => {
    const isReselect = selection?.kind === 'location' && selection.name === locationName;

    if (isReselect) {
      animateTo(0, 0, 1);
      setSelection(null);
      return;
    }

    const location = SOCO_LOCATION_DATA[locationName];
    if (!projection || !location) return;

    const point = projection([location.lng, location.lat]);
    if (!point) return;

    animateTo(
      clampPan(WIDTH / 2 - LOCATION_ZOOM * point[0], LOCATION_ZOOM, WIDTH),
      clampPan(HEIGHT / 2 - LOCATION_ZOOM * point[1], LOCATION_ZOOM, HEIGHT),
      LOCATION_ZOOM,
    );
    setSelection({ kind: 'location', name: locationName });
    setHover(null);
  };

  const handleReset = () => {
    animateTo(0, 0, 1);
    setSelection(null);
  };

  const setHoverAt = (kind: SelectionKind, name: string, clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setHover({ kind, name, screenX: clientX - rect.left, screenY: clientY - rect.top });
  };

  const handleMouseMove = (feature: DistrictFeature, event: React.MouseEvent<SVGPathElement>) => {
    if (viewMode === 'locations') return;
    setHoverAt('district', feature.properties.district, event.clientX, event.clientY);
  };

  const lookup = (kind: SelectionKind, name: string) =>
    kind === 'location'
      ? SOCO_LOCATION_DATA[name] ?? DEFAULT_DISTRICT_CVR
      : DISTRICT_CVR_DATA[name] ?? DEFAULT_DISTRICT_CVR;

  // A location borrows its district's colour so the panel stays visually tied
  // to the region it sits in.
  const colorFor = (kind: SelectionKind, name: string) => {
    const districtName = kind === 'location' ? SOCO_LOCATION_DATA[name]?.district ?? name : name;
    return DISTRICT_COLORS[districtName] ?? DEFAULT_DISTRICT_COLOR;
  };

  const selectedData = selection ? lookup(selection.kind, selection.name) : null;
  const selectedColor = selection ? colorFor(selection.kind, selection.name) : DEFAULT_DISTRICT_COLOR;
  const hoverData = hover ? lookup(hover.kind, hover.name) : null;

  /** District currently in focus, whether selected directly or via one of its pins. */
  const focusedDistrict = selection
    ? selection.kind === 'location'
      ? SOCO_LOCATION_DATA[selection.name]?.district ?? null
      : selection.name
    : null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Sri Lanka — District Map
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Click a district for its combined total, or a pin for one SOCO location</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {VIEW_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setViewMode(option.value);
                  setHover(null);
                  if (selection) handleReset();
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === option.value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {selection && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset view
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="relative w-full mt-3" style={{ height: HEIGHT }}>
        {!geoData || !pathGenerator ? (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-sm text-gray-400">Loading map…</p>
          </div>
        ) : (
          <>
            <div className="absolute top-2 right-2 z-10 flex flex-col items-center text-gray-300">
              <Compass className="w-5 h-5" />
              <span className="text-[9px] font-bold">N</span>
            </div>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="bg-blue-50/30 rounded-lg"
            >
              <g ref={gRef} transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                {geoData.features.map((feature) => {
                  const isSelected = selection?.kind === 'district' && selection.name === feature.properties.district;
                  const isHovered = hover?.kind === 'district' && hover.name === feature.properties.district;
                  const isDimmed = focusedDistrict !== null && focusedDistrict !== feature.properties.district;
                  const colors = DISTRICT_COLORS[feature.properties.district] ?? DEFAULT_DISTRICT_COLOR;
                  const centroid = projection ? projection(geoCentroid(feature as unknown as GeoJSON.GeoJSON)) : null;

                  // Only draw a label once the district's on-screen footprint
                  // is wide enough for its name to fit without colliding with
                  // neighbors (e.g. Ampara vs. Badulla/Monaragala at low zoom).
                  let showLabel = false;
                  let fontSize = 8;
                  if (projection && !isDimmed && viewMode !== 'locations') {
                    const bounds = geoBounds(feature as unknown as GeoJSON.GeoJSON);
                    const [[bx0], [bx1]] = [projection(bounds[0])!, projection(bounds[1])!];
                    const screenWidth = Math.abs(bx1 - bx0) * transform.k;
                    const estimatedTextWidth = feature.properties.district.length * 4.6;
                    showLabel = isSelected || screenWidth > estimatedTextWidth;
                    fontSize = Math.min(11, Math.max(6, 8 / transform.k));
                  }

                  const labelOffset = LABEL_OFFSETS[feature.properties.district];

                  return (
                    <g key={feature.properties.iso}>
                      <path
                        d={pathGenerator(feature as unknown as GeoJSON.GeoJSON) ?? undefined}
                        fill={isSelected ? colors.dark : isHovered ? colors.hover : colors.light}
                        stroke={isSelected ? colors.dark : '#94a3b8'}
                        strokeWidth={isSelected ? 1.5 : 1}
                        opacity={isDimmed ? 0.35 : 1}
                        vectorEffect="non-scaling-stroke"
                        className={`transition-[opacity,stroke-width] duration-200 ${viewMode === 'locations' ? '' : 'cursor-pointer'}`}
                        onClick={() => handleDistrictClick(feature)}
                        onMouseMove={(e) => handleMouseMove(feature, e)}
                        onMouseLeave={() => setHover(null)}
                      />
                      {centroid && showLabel && (
                        <text
                          x={centroid[0] + (labelOffset?.dx ?? 0)}
                          y={centroid[1] + (labelOffset?.dy ?? 0)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="pointer-events-none select-none"
                          style={{
                            fontSize,
                            fontWeight: 600,
                            fill: isSelected ? '#ffffff' : '#475569',
                          }}
                        >
                          {MULTILINE_LABELS[feature.properties.district] ? (
                            MULTILINE_LABELS[feature.properties.district].map((line, idx) => (
                              <tspan key={idx} x={centroid[0] + (labelOffset?.dx ?? 0)} dy={idx === 0 ? 0 : '1.2em'}>
                                {line}
                              </tspan>
                            ))
                          ) : (
                            feature.properties.district
                          )}
                        </text>
                      )}
                    </g>
                  );
                })}

                {projection &&
                  viewMode !== 'districts' &&
                  SOCO_LOCATIONS.map((location) => {
                    const point = projection([location.lng, location.lat]);
                    if (!point) return null;

                    const isSelected = selection?.kind === 'location' && selection.name === location.name;
                    const isHovered = hover?.kind === 'location' && hover.name === location.name;
                    const isDimmed = focusedDistrict !== null && focusedDistrict !== location.district;
                    // Counter-scale so the pin keeps a constant on-screen size.
                    const s = PIN_SCALE / transform.k;
                    const showLabel = viewMode === 'locations' || isSelected || isHovered || transform.k > 3;

                    return (
                      <g
                        key={location.name}
                        transform={`translate(${point[0]},${point[1]}) scale(${s})`}
                        opacity={isDimmed ? 0.25 : 1}
                        className="cursor-pointer transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocationClick(location.name);
                        }}
                        onMouseMove={(e) => {
                          e.stopPropagation();
                          setHoverAt('location', location.name, e.clientX, e.clientY);
                        }}
                        onMouseLeave={() => setHover(null)}
                      >
                        {/* Pin body, anchored so the tip sits on the coordinate. */}
                        <g transform="translate(-12,-22)">
                          <path
                            d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
                            fill={isHovered || isSelected ? PIN_FILL_HOVER : PIN_FILL}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            className="transition-colors duration-150"
                          />
                          <circle cx={12} cy={10} r={3} fill="#ffffff" />
                        </g>
                        {/* Generous transparent hit area — the pin itself is tiny. */}
                        <circle cx={0} cy={-12} r={13} fill="transparent" />
                        {showLabel && (
                          <text
                            y={7}
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                            style={{ fontSize: 9, fontWeight: 700, fill: '#7f1d1d' }}
                            stroke="#ffffff"
                            strokeWidth={2.5}
                            paintOrder="stroke"
                          >
                            {location.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
              </g>
            </svg>

            {hover && hoverData && !selection && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-800 text-white rounded-lg shadow-xl px-3.5 py-2.5 text-xs min-w-[150px]"
                style={{
                  left: Math.min(hover.screenX + 14, WIDTH - 160),
                  top: Math.max(hover.screenY - 60, 4),
                }}
              >
                <p className="font-bold text-sm mb-0.5">{hover.name}</p>
                <p className="text-slate-300 text-[10px] mb-1.5">{hoverData.province}</p>
                <div className="flex items-center gap-3">
                  <span className="text-blue-300 font-semibold">{hoverData.total.toLocaleString()} CVRs</span>
                  <span className="text-green-300 font-semibold">{hoverData.officers} officers</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DistrictDetailPanel
        districtName={selection?.name ?? null}
        data={selectedData}
        color={selectedColor}
        onClose={handleReset}
        onViewFullReport={(name) => console.log('View full report for', name)}
      />
    </div>
  );
}
