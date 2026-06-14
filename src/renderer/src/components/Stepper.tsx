import { useTranslation } from 'react-i18next'
import type { Step } from '../App'

interface StepperProps {
  steps: readonly Step[]
  current: Step
  canVisit: Record<Step, boolean>
  onSelect: (id: Step) => void
}

export function Stepper({
  steps,
  current,
  canVisit,
  onSelect
}: StepperProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <nav className="stepper" aria-label={t('steps.navLabel')}>
      <ol className="stepper__list">
        {steps.map((id, index) => {
          const active = id === current
          const enabled = canVisit[id]
          return (
            <li key={id} className="stepper__li">
              <button
                type="button"
                className={`stepper__item ${active ? 'is-active' : ''}`}
                disabled={!enabled}
                aria-current={active ? 'step' : undefined}
                onClick={() => enabled && onSelect(id)}
              >
                <span className="stepper__index" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="stepper__label">{t(`steps.${id}`)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
