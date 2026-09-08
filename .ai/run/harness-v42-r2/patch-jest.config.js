/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  // /e2e/         - Playwright specs, not jest's to run.
  // /\.claude/    - this harness places git worktrees under .claude/worktrees/**;
  //                 without this, any worktree present sweeps its own stale
  //                 test copy (against its own separate node_modules) into
  //                 every jest run. decision 0005 hit this live - a stray,
  //                 already-pushed worktree broke verify.sh full/deep for
  //                 reasons unrelated to the actual change being verified.
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/\\.claude/'],
};
