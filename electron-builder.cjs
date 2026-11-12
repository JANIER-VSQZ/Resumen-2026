module.exports = {
  appId: 'org.asonog.nuestralabor2026',
  productName: 'ASONOG Nuestra Labor 2026',
  artifactName: 'ASONOG-proyectos-2026.${ext}',
  directories: { output: 'release' },
  files: ['desktop/main.cjs', 'dist/**/*', 'package.json', '!node_modules/**/*'],
  asar: true,
  npmRebuild: false,
  win: {
    target: [{ target: 'portable', arch: ['x64'] }],
    icon: 'build/icon.ico',
    signExecutable: false,
  },
  portable: { requestExecutionLevel: 'user' },
};
