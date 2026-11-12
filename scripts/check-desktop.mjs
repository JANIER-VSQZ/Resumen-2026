// Preserve the documented command while sharing the web/desktop interaction checks.
process.argv.push('--desktop');
await import('./check-ui.mjs');
