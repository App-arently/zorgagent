/**
 * Runtime state — shared between server and index
 * Holds the current instelling config loaded at startup
 */

export interface Medewerker {
  naam: string
  telefoon: string
  rol?: string
  evv?: boolean
}

let medewerkers: Medewerker[] = []
let instelling = 'Zorgcentrum Zonnebloom'

export function setMedewerkers(m: Medewerker[]) {
  medewerkers = m
}

export function getMedewerkers(): Medewerker[] {
  return medewerkers
}

export function setInstelling(name: string) {
  instelling = name
}

export function getInstelling(): string {
  return instelling
}
