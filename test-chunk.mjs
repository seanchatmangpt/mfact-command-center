import { Parser } from '@unrdf/core/rdf/n3-justified-only.mjs';
const parser = new Parser();
let count = 0;
// n3 Parser does have addChunk method in version 1.x!
try {
    parser.parse('', (error, quad, prefixes) => {
        if (quad) count++;
        else console.log("Done", count);
    });
    parser.addChunk('<http://a> <http://b> <http://c> .\n');
    parser.addChunk('<http://d> <http://e> <http://f> .\n');
    parser.end();
} catch (e) {
    console.error(e);
}
