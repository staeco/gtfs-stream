import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    // Add timeout options to prevent hanging
    watch: {
      buildDelay: 1000,
      clearScreen: true,
      include: 'src/**'
    },
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'es',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: [
      'csv-parser',
      'gtfs-rt-bindings',
      'gtfs-types',
      'lodash.pickby',
      'pluralize',
      'pumpify',
      'remove-bom-stream',
      'through2',
      'unzipper',
      'path',
      'stream'
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.json',
        outDir: './dist/dts',
        rootDir: './src',
        declaration: true,
        declarationDir: './dist/dts'
      })
    ]
  },
  {
    input: 'dist/dts/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];