import { loadProjectDrafts, loadYearTitles, printNdJson } from './lib/inputs'

const dryRun = process.argv.includes('--dry-run')

const drafts = await loadProjectDrafts()
const yearTitles = await loadYearTitles()

for (const draft of drafts) printNdJson('project', { ...draft, yearTitles })

if (dryRun) {
  process.stdout.write(`Dry run only: ${drafts.length} project draft(s) printed, no writes.\n`)
  process.exit(0)
}

process.stderr.write(
  'Live import is not wired yet: it needs the Sanity project (Human Prerequisite 1) and will use createOrReplace on the fixed _ids with assets.upload for images. Dry-run payloads above are the exact write payloads.\n',
)
process.exit(1)
