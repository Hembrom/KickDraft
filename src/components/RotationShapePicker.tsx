import { formationLabel, getRotationShapes } from '@shared/rotation-lineup';
import { cn } from '@/lib/utils';

export function RotationShapePicker({
  format,
  value,
  onChange,
  readOnly = false,
}: {
  format: number;
  value: number[];
  onChange: (shape: number[]) => void;
  readOnly?: boolean;
}) {
  const selected = formationLabel(value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shape</p>
      <div className="flex flex-wrap rounded-xl border border-slate-200 p-1">
        {getRotationShapes(format).map((shape) => {
          const key = formationLabel(shape);
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={readOnly}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-sm font-semibold sm:px-3',
                active ? 'bg-elite-600 text-white' : 'text-slate-600 hover:bg-slate-50',
                readOnly && !active && 'opacity-60',
                readOnly && 'cursor-default',
              )}
              onClick={() => {
                if (!readOnly) onChange(shape);
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
