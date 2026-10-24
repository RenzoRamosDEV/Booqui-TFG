import {
  Cpu,
  GraduationCap,
  Music,
  Palette,
  Sparkles,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { createElement } from 'react'
import { normalize } from '../../../lib/text'

const icons: Record<string, LucideIcon> = {
  musica: Music,
  arte: Palette,
  deporte: Trophy,
  gastronomia: UtensilsCrossed,
  tecnologia: Cpu,
  educacion: GraduationCap,
}

export function CategoryIcon({ category, ...props }: LucideProps & { category: string }) {
  return createElement(icons[normalize(category)] ?? Sparkles, { 'aria-hidden': true, ...props })
}
