import { useMemo, useRef, useState } from "react";

const VIEW_WIDTH = 600;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export default function LineChart({
  data,
  color,
  formatValue = (v) => String(v),
  formatDate = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  height = 180,
}) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const layout = useMemo(() => {
    if (data.length === 0) return null;

    const xs = data.map((d) => d.x.getTime());
    const ys = data.map((d) => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minYRaw = Math.min(...ys);
    const maxYRaw = Math.max(...ys);
    const spread = maxYRaw - minYRaw || Math.abs(maxYRaw) * 0.1 || 1;
    const minY = minYRaw - spread * 0.15;
    const maxY = maxYRaw + spread * 0.15;

    const innerWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerHeight = height - PAD_TOP - PAD_BOTTOM;

    const xScale = (t) => PAD_LEFT + ((t - minX) / (maxX - minX || 1)) * innerWidth;
    const yScale = (v) => PAD_TOP + innerHeight - ((v - minY) / (maxY - minY || 1)) * innerHeight;

    const points = data.map((d) => ({ ...d, px: xScale(d.x.getTime()), py: yScale(d.y) }));
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.px} ${p.py}`).join(" ");

    const round1 = (v) => Math.round(v * 10) / 10;
    const gridValues = [round1(minYRaw), round1((minYRaw + maxYRaw) / 2), round1(maxYRaw)];

    return { points, path, gridValues, yScale };
  }, [data, height]);

  function handlePointerMove(e) {
    if (!layout || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VIEW_WIDTH;

    let nearest = 0;
    let nearestDist = Infinity;
    layout.points.forEach((p, i) => {
      const dist = Math.abs(p.px - svgX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });

    setHoverIndex(nearest);
    const point = layout.points[nearest];
    setTooltipPos({
      left: rect.left + (point.px / VIEW_WIDTH) * rect.width,
      top: rect.top + (point.py / height) * rect.height,
    });
  }

  function handlePointerLeave() {
    setHoverIndex(null);
    setTooltipPos(null);
  }

  if (!layout) {
    return <p className="text-sm text-slate-400 py-8 text-center">Sem dados suficientes ainda.</p>;
  }

  if (data.length === 1) {
    return (
      <p className="text-sm text-slate-600 py-8 text-center">
        Só um registro até agora ({formatValue(data[0].y)} em {formatDate(data[0].x)}). Registre mais para ver a
        evolução.
      </p>
    );
  }

  const last = layout.points[layout.points.length - 1];
  const hovered = hoverIndex !== null ? layout.points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="w-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {layout.gridValues.map((v, i) => {
          const y = layout.yScale(v);
          return (
            <g key={i}>
              <line x1={PAD_LEFT} y1={y} x2={VIEW_WIDTH - PAD_RIGHT} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD_LEFT - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-slate-400" fontSize={10}>
                {formatValue(v)}
              </text>
            </g>
          );
        })}

        <path d={layout.path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <line
            x1={hovered.px}
            y1={PAD_TOP}
            x2={hovered.px}
            y2={height - PAD_BOTTOM}
            stroke="#94a3b8"
            strokeWidth={1}
          />
        )}

        <circle cx={last.px} cy={last.py} r={4} fill={color} stroke="white" strokeWidth={2} />
        {hovered && hovered !== last && (
          <circle cx={hovered.px} cy={hovered.py} r={4} fill={color} stroke="white" strokeWidth={2} />
        )}

        <text x={last.px} y={last.py - 10} textAnchor="end" className="fill-slate-600 font-medium" fontSize={11}>
          {formatValue(last.y)}
        </text>

        <text x={PAD_LEFT} y={height - 6} className="fill-slate-400" fontSize={10}>
          {formatDate(layout.points[0].x)}
        </text>
        <text x={VIEW_WIDTH - PAD_RIGHT} y={height - 6} textAnchor="end" className="fill-slate-400" fontSize={10}>
          {formatDate(last.x)}
        </text>
      </svg>

      {hovered && tooltipPos && (
        <div
          className="fixed z-20 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-800 text-white text-xs rounded-lg px-2 py-1 shadow-lg"
          style={{ left: tooltipPos.left, top: tooltipPos.top - 10 }}
        >
          <div className="font-semibold">{formatValue(hovered.y)}</div>
          <div className="text-slate-300">{formatDate(hovered.x)}</div>
        </div>
      )}
    </div>
  );
}
