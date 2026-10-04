import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Droplets,
  Sprout as Sparkles,
  Layers,
  Activity,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  Clock,
  Play,
  Pause,
  TrendingUp,
  Satellite,
  Calendar,
} from 'lucide-react';
import type { Farm } from '@/src/types';

export type HeatmapMode = 'composite' | 'moisture' | 'nitrogen' | 'ndvi';

export interface SatelliteScan {
  id: string;
  daysAgo: number;
  label: string;
  shortLabel: string;
  date: string;
  satellite: string;
  cloudCover: string;
  ndviDelta: number;
  biomassScore: number;
  stageNote: string;
}

export const SATELLITE_SCANS: SatelliteScan[] = [
  {
    id: 'scan-30d',
    daysAgo: 30,
    label: '30 Days Ago',
    shortLabel: '-30d',
    date: 'Aug 25, 2026',
    satellite: 'Sentinel-2A MSI',
    cloudCover: '2.4%',
    ndviDelta: -0.26,
    biomassScore: 54,
    stageNote: 'Early shoot emergence & root establishment (V2 stage)',
  },
  {
    id: 'scan-14d',
    daysAgo: 14,
    label: '14 Days Ago',
    shortLabel: '-14d',
    date: 'Sep 10, 2026',
    satellite: 'Sentinel-2B MSI',
    cloudCover: '0.9%',
    ndviDelta: -0.14,
    biomassScore: 69,
    stageNote: 'Rapid tillering and leaf area index (LAI) expansion (V5 stage)',
  },
  {
    id: 'scan-7d',
    daysAgo: 7,
    label: '7 Days Ago',
    shortLabel: '-7d',
    date: 'Sep 17, 2026',
    satellite: 'Sentinel-2A MSI',
    cloudCover: '3.8%',
    ndviDelta: -0.05,
    biomassScore: 82,
    stageNote: 'Near-complete canopy closure with high nitrogen assimilation (R1 stage)',
  },
  {
    id: 'scan-current',
    daysAgo: 0,
    label: 'Today (Live)',
    shortLabel: 'Live',
    date: 'Sep 24, 2026',
    satellite: 'Sentinel-2B Multispectral',
    cloudCover: '1.2%',
    ndviDelta: 0.0,
    biomassScore: 93,
    stageNote: 'Peak flowering & pod formation with dense canopy chlorophyll (R2 stage)',
  },
];

interface CellData {
  x: number;
  y: number;
  row: number;
  col: number;
  zoneId: string;
  moisture: number;
  nitrogen: number;
  ndvi: number;
  compositeScore: number;
  status: string;
}

interface CropHealthHeatmapProps {
  farm: Farm;
}

export function CropHealthHeatmap({ farm }: CropHealthHeatmapProps) {
  const [activeMode, setActiveMode] = useState<HeatmapMode>('composite');
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [seed, setSeed] = useState<number>(0);

  // Time-Slider State (0 = 30d ago, 1 = 14d ago, 2 = 7d ago, 3 = Today/Live)
  const [scanIndex, setScanIndex] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const activeScan = SATELLITE_SCANS[scanIndex];

  // Auto-play timelapse handler
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % SATELLITE_SCANS.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const cols = 12;
  const rows = 7;

  const gridData = useMemo<CellData[]>(() => {
    const baseMoisture = farm.moisturePercent || 28;
    const baseNitrogen = farm.nitrogen || 140;
    const baseNdvi = farm.healthScore || 0.8;

    const scanNdviOffset = activeScan.ndviDelta;
    const scanMoistureOffset = activeScan.daysAgo > 14 ? -5.2 : activeScan.daysAgo > 0 ? -2.1 : 0;
    const scanNitrogenOffset = activeScan.daysAgo > 14 ? -28 : activeScan.daysAgo > 0 ? -12 : 0;

    const data: CellData[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spatialVariance =
          Math.sin((c + farm.id * 1.5 + seed) * 0.7) * 0.4 +
          Math.cos((r + farm.id * 0.8 + seed) * 0.9) * 0.4;

        const moistureVariance = spatialVariance * 7 + (r / rows) * 4 - 2;
        const moisture = Math.max(
          12,
          Math.min(42, Number((baseMoisture + moistureVariance + scanMoistureOffset).toFixed(1)))
        );

        const nitrogenVariance = spatialVariance * 25 + Math.sin(c * 1.2) * 12;
        const nitrogen = Math.max(
          60,
          Math.min(210, Math.round(baseNitrogen + nitrogenVariance + scanNitrogenOffset))
        );

        const ndviVariance = spatialVariance * 0.11;
        const ndvi = Math.max(
          0.22,
          Math.min(0.97, Number((baseNdvi + ndviVariance + scanNdviOffset).toFixed(2)))
        );

        const mNorm = Math.min(1, Math.max(0, (moisture - 18) / 16));
        const nNorm = Math.min(1, Math.max(0, (nitrogen - 90) / 90));
        const compositeScore = Math.round((mNorm * 0.35 + nNorm * 0.35 + ndvi * 0.3) * 100);

        let status = 'Optimal Biomass';
        if (moisture < 20) status = 'Irrigation Needed';
        else if (nitrogen < 105) status = 'Nitrogen Deficient';
        else if (ndvi < 0.55) status = 'Sparse Canopy';
        else if (ndvi < 0.68) status = 'Vegetative Maturation';
        else if (moisture > 34) status = 'High Water Saturation';

        const rowLetter = String.fromCharCode(65 + r);
        const zoneId = `Zone ${rowLetter}-${c + 1}`;

        data.push({
          x: c,
          y: r,
          row: r,
          col: c,
          zoneId,
          moisture,
          nitrogen,
          ndvi,
          compositeScore,
          status,
        });
      }
    }
    return data;
  }, [farm, seed, activeScan]);

  const colorScale = useMemo(() => {
    switch (activeMode) {
      case 'moisture':
        return d3.scaleSequential(d3.interpolateBlues).domain([14, 38]);
      case 'nitrogen':
        return d3.scaleSequential(d3.interpolateYlGn).domain([75, 200]);
      case 'ndvi':
        return d3.scaleSequential(d3.interpolateViridis).domain([0.3, 0.95]);
      case 'composite':
      default:
        return d3.scaleSequential(d3.interpolateGreens).domain([30, 95]);
    }
  }, [activeMode]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 580;
    const height = 260;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const padding = 1.5;

    const g = svg.append('g').attr('class', 'heatmap-grid');

    const cells = g
      .selectAll<SVGRectElement, CellData>('rect')
      .data(gridData, (d) => `${d.col}-${d.row}`);

    cells
      .enter()
      .append('rect')
      .attr('x', (d) => d.col * cellWidth + padding)
      .attr('y', (d) => d.row * cellHeight + padding)
      .attr('width', cellWidth - padding * 2)
      .attr('height', cellHeight - padding * 2)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', 'rgba(255, 255, 255, 0.12)')
      .attr('stroke-width', 0.75)
      .attr('cursor', 'pointer')
      .attr('opacity', 0)
      .attr('fill', (d) => {
        let val = d.compositeScore;
        if (activeMode === 'moisture') val = d.moisture;
        else if (activeMode === 'nitrogen') val = d.nitrogen;
        else if (activeMode === 'ndvi') val = d.ndvi;
        return colorScale(val);
      })
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .raise()
          .transition()
          .duration(120)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
        setHoveredCell(d);
      })
      .on('mousemove', function (event) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke', 'rgba(255, 255, 255, 0.12)')
          .attr('stroke-width', 0.75);

        setHoveredCell(null);
      })
      .transition()
      .duration(380)
      .delay((d) => (d.col + d.row) * 10)
      .attr('opacity', showOverlay ? 0.9 : 0.25);

    if (activeMode === 'moisture' || activeMode === 'composite') {
      const contourGroup = svg.append('g').attr('class', 'contour-lines').attr('pointer-events', 'none');

      const lineData = [
        d3.range(0, width + 10, 40).map((x) => [x, 60 + Math.sin(x * 0.02 + seed) * 18]),
        d3.range(0, width + 10, 40).map((x) => [x, 140 + Math.cos(x * 0.025 + seed) * 22]),
        d3.range(0, width + 10, 40).map((x) => [x, 210 + Math.sin(x * 0.018 + seed) * 16]),
      ];

      const lineGen = d3.line().curve(d3.curveBasis);

      lineData.forEach((pts) => {
        contourGroup
          .append('path')
          .attr('d', lineGen(pts as [number, number][]))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(255, 255, 255, 0.22)')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '4, 4');
      });
    }
  }, [gridData, activeMode, showOverlay, colorScale, cols, rows, seed]);

  // Overall 30d growth calculation
  const growthDelta = useMemo(() => {
    const baseline = SATELLITE_SCANS[0].biomassScore;
    const current = activeScan.biomassScore;
    const diff = current - baseline;
    return diff >= 0 ? `+${diff}%` : `${diff}%`;
  }, [activeScan]);

  return (
    <div className="space-y-4">
      {/* Top Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex p-1 rounded-2xl frosted-glass-sub border border-white/60 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('composite')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'composite'
                ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                : 'text-slate-800 dark:text-slate-300 hover:bg-white/80'
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Composite Vigor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('moisture')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'moisture'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-800 dark:text-slate-300 hover:bg-sky-100'
            }`}
          >
            <Droplets className="size-3.5" />
            <span>Soil Moisture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('nitrogen')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'nitrogen'
                ? 'bg-lime-600 text-white shadow-2xs'
                : 'text-slate-800 dark:text-slate-300 hover:bg-emerald-100'
            }`}
          >
            <Activity className="size-3.5" />
            <span>Nitrogen Variation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('ndvi')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'ndvi'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-800 dark:text-slate-300 hover:bg-emerald-100'
            }`}
          >
            <Layers className="size-3.5" />
            <span>Sentinel NDVI</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="p-1.5 rounded-xl frosted-glass-sub border border-white/60 text-slate-700 dark:text-slate-300 hover:text-[var(--brand-color,#0f9a58)] transition-all cursor-pointer shadow-2xs"
            title="Simulate live sensor pass & re-render D3 heat contours"
          >
            <RefreshCw className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl frosted-glass-sub border border-white/60 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white/80 transition-all cursor-pointer shadow-2xs"
          >
            {showOverlay ? (
              <Eye className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            ) : (
              <EyeOff className="size-3.5 text-slate-400" />
            )}
            <span>{showOverlay ? 'Overlay Active' : 'Base Map'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Satellite NDVI Time-Slider Scrubber */}
      <div className="p-3 sm:p-4 rounded-2xl frosted-card border border-white/80 dark:border-white/12 shadow-sm space-y-3">
        {/* Time-Slider Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-[var(--brand-color,#0f9a58)]/15 border border-[var(--brand-color,#0f9a58)]/30 flex items-center justify-center text-[var(--brand-color,#0f9a58)]">
              <Clock className="size-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  NDVI Satellite Time-Scrubber
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                  {activeScan.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="size-3 text-slate-400 shrink-0" />
                <span>{activeScan.date}</span>
                <span>•</span>
                <Satellite className="size-3 text-slate-400 shrink-0" />
                <span>{activeScan.satellite} (Clouds: {activeScan.cloudCover})</span>
              </p>
            </div>
          </div>

          {/* Controls: Play/Pause Timelapse + Biomass Growth Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isPlaying
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  : 'bg-[var(--brand-color,#0f9a58)] text-white border-[var(--brand-color,#0f9a58)] hover:opacity-95'
              }`}
              title={isPlaying ? 'Pause NDVI Satellite Timelapse' : 'Play 30-Day Growth Timelapse'}
            >
              {isPlaying ? (
                <>
                  <Pause className="size-3 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="size-3 fill-current" />
                  <span>Play Timelapse</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-[var(--brand-text,#0d7342)] border border-emerald-500/20 text-xs font-black shadow-2xs">
              <TrendingUp className="size-3" />
              <span>Biomass: {activeScan.biomassScore}%</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                ({growthDelta} vs 30d ago)
              </span>
            </div>
          </div>
        </div>

        {/* Range Slider & Visual Stepper */}
        <div className="space-y-2 pt-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={SATELLITE_SCANS.length - 1}
              step={1}
              value={scanIndex}
              onChange={(e) => {
                setScanIndex(Number(e.target.value));
                if (isPlaying) setIsPlaying(false);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--brand-color,#0f9a58)] focus:outline-none"
              aria-label="Satellite Scan Time Slider"
            />
          </div>

          {/* Stepper Label Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {SATELLITE_SCANS.map((scan, idx) => {
              const isSelected = scanIndex === idx;
              return (
                <button
                  key={scan.id}
                  type="button"
                  onClick={() => {
                    setScanIndex(idx);
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white border-[var(--brand-color,#0f9a58)] shadow-md scale-[1.02]'
                      : 'bg-white/60 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-black leading-tight">
                    <span>{scan.label}</span>
                    <span
                      className={`text-[9px] px-1 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'text-slate-500'
                      }`}
                    >
                      {scan.date.split(',')[0]}
                    </span>
                  </div>
                  <div
                    className={`text-[9.5px] truncate font-semibold mt-0.5 ${
                      isSelected ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Biomass {scan.biomassScore}% (NDVI {scan.daysAgo === 0 ? '0.84' : scan.daysAgo === 7 ? '0.78' : scan.daysAgo === 14 ? '0.69' : '0.56'})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Growth Trend Commentary */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium">
          <span className="truncate">
            <strong className="text-slate-900 dark:text-white">Phenology Status: </strong>
            {activeScan.stageNote}
          </span>
          <span className="shrink-0 text-[10px] text-slate-500 pl-2">
            Resolution: 10m Pixel Band
          </span>
        </div>
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-white/60 dark:border-white/12 bg-slate-950 p-2 shadow-inner group select-none"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 opacity-90 pointer-events-none" />

        <svg ref={svgRef} className="relative z-10 block rounded-xl overflow-hidden" />

        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-200 border border-white/10">
          <span className="size-2 rounded-full bg-[var(--brand-color,#0f9a58)] animate-pulse" />
          <span>D3 Raster Grid: 84 Micro-Quadrants</span>
          <span className="text-emerald-400">• {farm.name}</span>
          <span className="text-amber-400">• [{activeScan.label}]</span>
        </div>

        {/* Hover Tooltip */}
        {hoveredCell && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none rounded-2xl frosted-card border border-white/80 p-3 shadow-xl backdrop-blur-2xl text-xs space-y-1.5 transition-all text-slate-950 dark:text-white"
            style={{
              left: Math.min(tooltipPos.x + 12, (containerRef.current?.clientWidth || 500) - 180),
              top: Math.max(10, Math.min(tooltipPos.y - 45, 140)),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-1">
              <span className="font-black text-slate-950 dark:text-white">{hoveredCell.zoneId}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)]">
                {hoveredCell.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-bold pt-0.5">
              <div>
                <span className="text-slate-500 text-[9px] block uppercase">Moisture</span>
                <span className="text-sky-600 dark:text-sky-400">{hoveredCell.moisture}%</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] block uppercase">Nitrogen</span>
                <span className="text-lime-600 dark:text-lime-400">{hoveredCell.nitrogen} kg</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] block uppercase">NDVI</span>
                <span className="text-[var(--brand-color,#0f9a58)]">{hoveredCell.ndvi}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
              <span>Health Index: <strong className="text-slate-950 dark:text-white">{hoveredCell.compositeScore}/100</strong></span>
              <span className="text-[9px] text-slate-400">Scan: {activeScan.shortLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-2xl frosted-glass-sub border border-white/60 text-xs font-semibold text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
          <span>
            {activeMode === 'composite' && 'Composite Health: Merges chlorophyll reflectance with root moisture and available N.'}
            {activeMode === 'moisture' && 'Soil Moisture Profile: Identifies subsurface drainage sinks and drought stress zones.'}
            {activeMode === 'nitrogen' && 'Nitrogen Variation: Highlights fertilizer wash-off spots vs optimal root uptake zones.'}
            {activeMode === 'ndvi' && 'Sentinel-2 NDVI: Multispectral canopy vigor calibrated to 10-meter pixel resolution.'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-500">Low</span>
          <div
            className={`h-2.5 w-32 rounded-full shadow-inner ${
              activeMode === 'moisture'
                ? 'bg-gradient-to-r from-sky-200 via-sky-500 to-sky-800'
                : activeMode === 'nitrogen'
                ? 'bg-gradient-to-r from-yellow-200 via-lime-400 to-emerald-700'
                : activeMode === 'ndvi'
                ? 'bg-gradient-to-r from-purple-800 via-teal-500 to-yellow-300'
                : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-800'
            }`}
          />
          <span className="text-[10px] font-bold text-slate-950 dark:text-white">Optimal</span>
        </div>
      </div>
    </div>
  );
}
