import { readFileSync } from 'fs';
import { extractResumeText_createServerFn_handler } from './.vercel/output/functions/__server.func/_ssr/ats-checker.functions-DEXoPnLM.mjs';

async function run() {
  try {
    const txtBuffer = readFileSync('test.txt');
    const txtBlob = new Blob([txtBuffer], { type: 'text/plain' });
    const txtFile = new File([txtBlob], 'test.txt', { type: 'text/plain', lastModified: Date.now() });
    
    const formData = new FormData();
    formData.append('file', txtFile);
    
    const result = await extractResumeText_createServerFn_handler({ data: formData });
    console.log("TXT Result:", result);
  } catch (err) {
    console.error("TXT Error:", err);
  }
}
run();
