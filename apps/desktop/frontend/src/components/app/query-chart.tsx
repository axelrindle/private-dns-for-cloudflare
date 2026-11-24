import type { Bucket } from '#bindings/internal/stats'
import { useMemo, useState } from 'react'

// Fixed stacking and color order. Every other type folds into "Other".
const SERIES = [
    { key: 'A', color: 'var(--chart-1)' },
    { key: 'AAAA', color: 'var(--chart-2)' },
    { key: 'HTTPS', color: 'var(--chart-3)' },
    { key: 'Other', color: 'var(--chart-other)' },
] as const

type SeriesKey = typeof SERIES[number]['key']

const seriesOf = (type: string): SeriesKey =>
    SERIES.find(s => s.key === type)?.key ?? 'Other'

const colorOf = (type: string) =>
    SERIES.find(s => s.key === seriesOf(type))!.color

const WIDTH = 448
const HEIGHT = 140
const PAD = { top: 6, right: 4, bottom: 20, left: 28 }
const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom
const GAP = 2

const X_TICKS = [
    { label: '60 min ago', x: PAD.left, anchor: 'start' },
    { label: '30 min ago', x: PAD.left + PLOT_W / 2, anchor: 'middle' },
    { label: 'now', x: WIDTH - PAD.right, anchor: 'end' },
] as const

const compact = new Intl.NumberFormat('en', { notation: 'compact' })

const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// Smallest 1/2/5 step so that two steps cover max.
function niceMax(max: number) {
    if (max <= 2) return 2
    const raw = max / 2
    const pow = 10 ** Math.floor(Math.log10(raw))
    const step = [1, 2, 5, 10].map(m => m * pow).find(s => s >= raw)!
    return step * 2
}

// Rect with rounded top corners only, anchored at the baseline.
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    r = Math.min(r, w / 2, h)
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

type Column = {
    time: number
    total: number
    stacks: Record<SeriesKey, number>
    types: [string, number][]
}

function toColumns(history: Bucket[]): Column[] {
    return history.map(b => {
        const stacks = { A: 0, AAAA: 0, HTTPS: 0, Other: 0 }
        if (!b.counts) {
            return { time: b.time, total: 0, stacks, types: [] }
        }
        const types = Object.entries(b.counts)
            .filter((e): e is [string, number] => !!e[1])
            .sort((a, b) => b[1] - a[1])
        for (const [type, count] of types) {
            stacks[seriesOf(type)] += count
        }
        return { time: b.time, total: types.reduce((n, [, c]) => n + c, 0), stacks, types }
    })
}

type QueryChartProps = {
    history: Bucket[]
}

export function QueryChart({ history }: QueryChartProps) {
    const columns = useMemo(() => toColumns(history), [history])
    const [hovered, setHovered] = useState<number | null>(null)

    const total = columns.reduce((n, c) => n + c.total, 0)
    const yMax = niceMax(Math.max(0, ...columns.map(c => c.total)))
    const y = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H

    const slot = PLOT_W / Math.max(columns.length, 1)
    const barW = Math.max(slot - GAP, 1)

    const totalsByType = useMemo(() => {
        const totals = new Map<string, number>()
        for (const c of columns) {
            for (const [type, count] of c.types) {
                totals.set(type, (totals.get(type) ?? 0) + count)
            }
        }
        return [...totals].sort((a, b) => b[1] - a[1])
    }, [columns])

    const active = hovered !== null ? columns[hovered] : null

    return (
        <figure className='w-full flex flex-col gap-y-2'>
            <figcaption className='flex items-baseline justify-between'>
                <span className='text-sm font-medium'>
                    Queries <span className='text-muted-foreground font-normal'>· last hour</span>
                </span>
                <span className='text-sm'>{compact.format(total)}</span>
            </figcaption>

            <ul className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                {SERIES.map(s => (
                    <li key={s.key} className='flex items-center gap-x-1.5'>
                        <span className='size-2.5 rounded-xs' style={{ background: s.color }} />
                        {s.key}
                    </li>
                ))}
            </ul>

            <div className='relative'>
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className='w-full h-auto text-muted-foreground'
                    role='img'
                    aria-label={`Stacked column chart of ${total} DNS queries per minute by type over the last hour`}
                    onMouseLeave={() => setHovered(null)}
                >
                    {[0, yMax / 2, yMax].map(v => (
                        <g key={v}>
                            <line
                                x1={PAD.left}
                                x2={WIDTH - PAD.right}
                                y1={y(v)}
                                y2={y(v)}
                                className='stroke-border'
                                strokeWidth={1}
                            />
                            <text
                                x={PAD.left - 6}
                                y={y(v)}
                                textAnchor='end'
                                dominantBaseline='middle'
                                fontSize={10}
                                fill='currentColor'
                                className='tabular-nums'
                            >
                                {compact.format(v)}
                            </text>
                        </g>
                    ))}

                    {columns.map((c, i) => {
                        const x = PAD.left + i * slot + (slot - barW) / 2
                        let base = 0
                        const segments = SERIES.filter(s => c.stacks[s.key] > 0)

                        return (
                            <g key={c.time} opacity={hovered === null || hovered === i ? 1 : 0.5}>
                                {segments.map((s, j) => {
                                    const top = y(base + c.stacks[s.key])
                                    // leave a surface gap above every segment but the top one
                                    const bottom = y(base) - (j > 0 ? GAP : 0)
                                    base += c.stacks[s.key]
                                    const h = bottom - top
                                    if (h <= 0) return null
                                    const isTop = j === segments.length - 1
                                    return isTop
                                        ? <path key={s.key} d={topRoundedRect(x, top, barW, h, 4)} fill={s.color} />
                                        : <rect key={s.key} x={x} y={top} width={barW} height={h} fill={s.color} />
                                })}
                                <rect
                                    x={PAD.left + i * slot}
                                    y={PAD.top}
                                    width={slot}
                                    height={PLOT_H}
                                    fill='transparent'
                                    onMouseEnter={() => setHovered(i)}
                                />
                            </g>
                        )
                    })}

                    {X_TICKS.map(t => (
                        <text key={t.label} x={t.x} y={HEIGHT - 4} textAnchor={t.anchor} fontSize={10} fill='currentColor'>
                            {t.label}
                        </text>
                    ))}
                </svg>

                {total === 0 && (
                    <p className='absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none'>
                        No queries in the last hour
                    </p>
                )}

                {active && hovered !== null && (
                    <div
                        className='absolute bottom-full mb-1 -translate-x-1/2 pointer-events-none min-w-28 rounded-md border bg-popover text-popover-foreground shadow-sm px-2 py-1.5 text-xs'
                        style={{ left: `${Math.min(85, Math.max(15, ((PAD.left + (hovered + 0.5) * slot) / WIDTH) * 100))}%` }}
                    >
                        <div className='flex justify-between gap-x-3 mb-1'>
                            <span className='text-muted-foreground'>{formatTime(active.time)}</span>
                            <span className='font-medium tabular-nums'>{active.total}</span>
                        </div>
                        {active.types.map(([type, count]) => (
                            <div key={type} className='flex items-center gap-x-1.5'>
                                <span className='size-2 rounded-xs' style={{ background: colorOf(type) }} />
                                <span className='flex-1'>{type}</span>
                                <span className='tabular-nums'>{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <table className='sr-only'>
                <caption>DNS queries by type, last hour</caption>
                <thead>
                    <tr><th>Type</th><th>Queries</th></tr>
                </thead>
                <tbody>
                    {totalsByType.map(([type, count]) => (
                        <tr key={type}><td>{type}</td><td>{count}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    )
}
