// JS-level zexlax/zexall driver for i8080.js. Runs the same instruction
// sweep that 8080EX1.COM performs in 8080 asm, but without the CP/M layer.
//
// Engine-portable failure exit:
//   process.exit — node, bun, deno, qjs (via process.js polyfill)
//   quit         — d8, jsc, spidermonkey
// Success path: just fall off the end (every engine exits 0 naturally).
// Plain `throw` is unreliable across engines: bun's bare-script invocation
// (`bun script.js`) prints the stack but still exits 0; only `bun run`
// propagates it. process.exit / quit avoid that pitfall.
if (!runZex()) {
  if (typeof process !== 'undefined' && process.exit) process.exit(1);
  else if (typeof quit === 'function') quit(1);
  else throw new Error('zex tests failed');
}
