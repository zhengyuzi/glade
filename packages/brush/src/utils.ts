export function toPoints(arr: number[]) {
  const points = []
  for (let i = 0; i < arr.length; i += 2) {
    points.push({ x: arr[i], y: arr[i + 1] })
  }
  return points
}
