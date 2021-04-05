const mtfuzz = require('./lib/driver').mtfuzz;
const fs = require('fs');

// Code under test...
const marqdown = require('./test/marqdown');

// Seed inputs
let mdA = fs.readFileSync('test/test.md','utf-8');
let mdB = fs.readFileSync('test/simple.md','utf-8');

let args = process.argv.slice(2);
const runs = args.length > 0 ? args[0] : 1000;

// Fuzz function 1000 (or given) times, with given seed string inputs.
mtfuzz(runs, [mdA, mdB], (md) => marqdown.render(md) );