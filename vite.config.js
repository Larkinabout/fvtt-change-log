const s_PACKAGE_ID = 'modules/change-log'
const s_COMPRESS = false // Set to true to compress the module bundle.
const s_SOURCEMAPS = true // Generate sourcemaps for the bundle (recommended).

export default {
    /** @type {import('vite').UserConfig} */
    root: 'src/', // Source location / esbuild root.
    base: `/${s_PACKAGE_ID}/`, // Base module path that 30001 / served dev directory.

    resolve: { conditions: ['import', 'browser'] },

    esbuild: {
        target: ['es2022']
    },

    server: {
        port: 30001,
        open: '/game',
        proxy: {
            // Serves static files from main Foundry server.
            [`^(/${s_PACKAGE_ID}/(assets|lang|packs|style.css))`]: 'http://localhost:30000',

            // All other paths besides package ID path are served from main Foundry server.
            [`^(?!/${s_PACKAGE_ID}/)`]: 'http://localhost:30000',

            // Enable socket.io from main Foundry server.
            '/socket.io': { target: 'ws://localhost:30000', ws: true }
        }
    },

    build: {
        outDir: '../dist',
        emptyOutDir: false,
        sourcemap: s_SOURCEMAPS,
        brotliSize: true,
        minify: s_COMPRESS ? 'terser' : false,
        target: ['es2022'],
        terserOptions: s_COMPRESS ? { keep_classnames: true, keep_fnames: true } : undefined,
        lib: {
            entry: './main/module.js',
            formats: ['es'],
            fileName: 'change-log'
        }
    },

    // Necessary when using the dev server for top-level await usage inside of TRL.
    optimizeDeps: {
        esbuildOptions: {
            target: 'es2022'
        }
    }
}
