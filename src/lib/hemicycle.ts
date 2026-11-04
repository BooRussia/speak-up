export type Seat = "D" | "R" | "I" | "V"

export type Counts = {
  democrat: number
  republican: number
  independent: number
  unlisted: number
  total: number
}

export function seatOrder(counts: Counts): Seat[] {
  const seats: (Seat | null)[] = Array.from({ length: counts.total }, () => null)
  for (let n = 0; n < counts.democrat; n++) seats[n] = "D"
  for (let n = 0; n < counts.republican; n++) seats[counts.total - 1 - n] = "R"
  const gaps = seats.flatMap((seat, index) => (seat === null ? [index] : []))
  gaps.forEach((index, order) => {
    seats[index] = order < counts.independent ? "I" : "V"
  })
  return seats.map((seat) => seat ?? "V")
}

export type Dot = { x: number; y: number; angle: number }

export function hemicycle(count: number): Dot[] {
  const rows = count > 150 ? 9 : 4
  const weights = Array.from({ length: rows }, (_, index) => index + 2)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  const counts: number[] = []
  let remaining = count
  for (let row = 0; row < rows; row++) {
    const take = row === rows - 1 ? remaining : Math.min(remaining, Math.max(1, Math.round((count * weights[row]) / weightSum)))
    counts.push(take)
    remaining -= take
  }
  if (remaining > 0) counts[counts.length - 1] += remaining

  const dots: Dot[] = []
  counts.forEach((rowCount, row) => {
    const radius = 48 + row * (count > 150 ? 18 : 32)
    for (let index = 0; index < rowCount; index++) {
      const t = rowCount === 1 ? 0.5 : index / (rowCount - 1)
      const angle = Math.PI - t * Math.PI
      dots.push({
        x: Math.cos(angle) * radius,
        y: -Math.sin(angle) * radius,
        angle,
      })
    }
  })
  dots.sort((a, b) => b.angle - a.angle || a.y - b.y)
  return dots
}
