import { loadMemberDrafts, printNdJson } from './lib/inputs'

const dryRun = process.argv.includes('--dry-run')

const members = loadMemberDrafts()
for (const member of members) printNdJson('member', member)

if (dryRun) {
  process.stdout.write(`Dry run only: ${members.length} member draft(s) printed, no writes.\n`)
  process.exit(0)
}

process.stderr.write(
  'Live import is not wired yet: it needs the Sanity project (Human Prerequisite 1) and will use createOrReplace on the fixed _ids. Dry-run payloads above are the exact write payloads.\n',
)
process.exit(1)
