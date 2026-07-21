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
const MAX_PAN_Y = 220;

interface HoverInfo {
  district: string;
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
  const [selected, setSelected] = useState<string | null>(null);
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

    // Vertical-only drag panning, clamped to +/-MAX_PAN_Y so the landmass can
    // shift up/down a limited amount but never drifts horizontally or off
    // past a fixed range (no horizontal pan at all, per design).
    let isDragging = false;
    let dragStartY = 0;
    let transformStartY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      isDragging = true;
      dragStartY = event.clientY;
      const current = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      transformStartY = current.y;
      svg.style.cursor = 'grabbing';
    };

    const handleMouseMoveDrag = (event: MouseEvent) => {
      if (!isDragging) return;
      const current = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      const deltaY = event.clientY - dragStartY;
      const nextY = Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, transformStartY + deltaY));
      const nextTransform = zoomIdentity.translate(current.x, nextY).scale(current.k);
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

  const handleDistrictClick = (feature: DistrictFeature) => {
    const districtName = feature.properties.district;
    const isReselect = selected === districtName;

    if (isReselect) {
      animateTo(0, 0, 1);
      setSelected(null);
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
    const translateX = WIDTH / 2 - scale * cx;
    const translateY = HEIGHT / 2 - scale * cy;

    animateTo(translateX, translateY, scale);
    setSelected(districtName);
    setHover(null);
  };

  const handleReset = () => {
    animateTo(0, 0, 1);
    setSelected(null);
  };

  const handleMouseMove = (feature: DistrictFeature, event: React.MouseEvent<SVGPathElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setHover({
      district: feature.properties.district,
      screenX: event.clientX - rect.left,
      screenY: event.clientY - rect.top,
    });
  };

  const selectedData = selected ? DISTRICT_CVR_DATA[selected] ?? DEFAULT_DISTRICT_CVR : null;
  const selectedColor = selected ? DISTRICT_COLORS[selected] ?? DEFAULT_DISTRICT_COLOR : DEFAULT_DISTRICT_COLOR;
  const hoverData = hover ? DISTRICT_CVR_DATA[hover.district] ?? DEFAULT_DISTRICT_CVR : null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Sri Lanka — District Map
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Click any district to explore SOCO data</p>
        </div>
        <div className="flex items-center gap-3">
          {selected && (
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
                  const isSelected = selected === feature.properties.district;
                  const isHovered = hover?.district === feature.properties.district;
                  const isDimmed = selected !== null && !isSelected;
                  const colors = DISTRICT_COLORS[feature.properties.district] ?? DEFAULT_DISTRICT_COLOR;
                  const centroid = projection ? projection(geoCentroid(feature as unknown as GeoJSON.GeoJSON)) : null;

                  // Only draw a label once the district's on-screen footprint
                  // is wide enough for its name to fit without colliding with
                  // neighbors (e.g. Ampara vs. Badulla/Monaragala at low zoom).
                  let showLabel = false;
                  let fontSize = 8;
                  if (projection && !isDimmed) {
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
                        className="cursor-pointer transition-[opacity,stroke-width] duration-200"
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
              </g>
            </svg>

            {hover && hoverData && !selected && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-800 text-white rounded-lg shadow-xl px-3.5 py-2.5 text-xs min-w-[150px]"
                style={{
                  left: Math.min(hover.screenX + 14, WIDTH - 160),
                  top: Math.max(hover.screenY - 60, 4),
                }}
              >
                <p className="font-bold text-sm mb-0.5">{hover.district}</p>
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
        districtName={selected}
        data={selectedData}
        color={selectedColor}
        onClose={handleReset}
        onViewFullReport={(name) => console.log('View full report for', name)}
      />
    </div>
  );
}
