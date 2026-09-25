import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({build:{target:'es2022',emptyOutDir:false,lib:{entry:resolve(__dirname,'worker/index.ts'),formats:['es'],fileName:()=> 'worker.js'},rollupOptions:{output:{inlineDynamicImports:true}}}});
