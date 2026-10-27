import type { Project } from '../content/types'

export function yearsOf(projects: Project[]): number[] {
  return [...new Set(projects.map(project => project.year))].sort((a, b) => b - a)
}

export function filterByYear(projects: Project[], year: number | null): Project[] {
  if (year === null) return projects
  return projects.filter(project => project.year === year)
}
