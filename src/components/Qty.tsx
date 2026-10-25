import { IconMinus, IconPlus } from './Icons'

export default function Qty({ value, onChange, label, size = 'md' }: { value: number; onChange: (v: number) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div className={`qty qty--${size}`} role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label={`One less ${label}`}>
        <IconMinus />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} aria-label={`One more ${label}`} disabled={value >= 99}>
        <IconPlus />
      </button>
    </div>
  )
}
