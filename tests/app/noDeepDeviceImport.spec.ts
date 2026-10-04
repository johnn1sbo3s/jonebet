import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Ticket 35: @nuxtjs/device é consumido pela superfície oficial do módulo
// (auto-import de useDevice). Deep import em node_modules bypassa o exports map
// e trava a atualização do pacote — nem em produção nem nos mocks dos specs.
const ROOT = join(__dirname, '..', '..')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(vue|js|ts)$/.test(entry)) out.push(full)
  }
  return out
}

// Montado por partes para este próprio arquivo não casar com o padrão.
const DEEP_IMPORT = new RegExp(['node_modules', '@nuxtjs', 'device'].join('/'))

describe('nenhum deep import de @nuxtjs/device', () => {
  it('nenhum arquivo de app/ ou tests/ importa o caminho interno do pacote de device', () => {
    const offenders: string[] = []
    for (const dir of ['app', 'tests']) {
      for (const file of sourceFiles(join(ROOT, dir))) {
        if (DEEP_IMPORT.test(readFileSync(file, 'utf8'))) offenders.push(file.slice(ROOT.length + 1))
      }
    }
    expect(offenders).toEqual([])
  })
})
