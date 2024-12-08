require('esbuild').build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  outfile: 'src/dist/bundle.js',
  loader: { '.js': 'jsx' },
  resolveExtensions: ['.js', '.jsx'],
  platform: 'browser',
  target: ['es2020'],
  external: [],
  nodePaths: ['node_modules'],
}).catch(() => process.exit(1)); 