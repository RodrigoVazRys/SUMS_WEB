// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const renderPercentLegend = (props: any) => {
  const { payload } = props
  if (!payload) return null

  const getVal = (entry: any) => {
    if (entry.payload) {
      if (typeof entry.payload.value === 'number') return entry.payload.value;
      if (typeof entry.payload.total === 'number') return entry.payload.total;
      if (typeof entry.payload.personas === 'number') return entry.payload.personas;
      if (typeof entry.payload.cantidad === 'number') return entry.payload.cantidad;
      
      // Fallback: search for any number
      for (const k in entry.payload) {
        if (typeof entry.payload[k] === 'number') return entry.payload[k];
      }
    }
    return typeof entry.value === 'number' ? entry.value : 0;
  }

  // Calculate total to manually compute percentage if 'percent' is not in payload
  const total = payload.reduce((sum: number, entry: any) => sum + getVal(entry), 0)

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 text-[11px] text-gray-600">
      {payload.map((entry: any, index: number) => {
        let percentNum = 0
        if (entry.payload?.percent !== undefined) {
          percentNum = entry.payload.percent * 100
        } else {
          const val = getVal(entry)
          percentNum = total > 0 ? (val / total) * 100 : 0
        }
        const percentStr = percentNum.toFixed(0)

        return (
          <li key={`item-${index}`} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span>{entry.value}</span>
            <span className="font-semibold text-gray-900">{percentStr}%</span>
          </li>
        )
      })}
    </ul>
  )
}
