const { execSync } = require('child_process');
const fs = require('fs');

if (process.argv.length < 2) process.exit(1);

let args = process.argv.slice(2);

let cmd = args.length ? args[0] : "all";
console.log(cmd, args);

if (cmd == "all") all();

if (cmd == 'files') files();

if (cmd == 'build') build();

if (cmd == 'test') test();

if (cmd == 'ex1') all(true);

function test() { 
  node("all.js"); 
}

function all(ex1) {
  files();
  build(ex1);
  timeit(test);
}

function build(ex1) {
  const files = ['files.js', 'i8080.js', 'i8080_disasm.js', 'i8080_trace.js', 'i8080_test.js'];
  files.push(ex1 ? "main_ex1.js" : "main.js");
  let contents = [];
  console.log(files);
  files.forEach((name) => {
    contents.push(fs.readFileSync(name));
    console.log(name, contents[contents.length - 1].length);
  });
  const raw = Buffer.concat(contents);
  console.log("all.js", raw.length);
  fs.writeFileSync("all.js", raw);
}

function files() {
  node('rkdump >files.js');
}

if (cmd == 'clean') {
  run('git clean -dfx');
}

// -------------------------------------

function timeit(cb) {
  const { performance } = require('perf_hooks');
  const started = performance.now();
  cb();
  const duration = (performance.now() - started) / 1000;
  console.log(`${duration.toFixed(2)}(s) ${(duration / 60).toFixed(2)}(m)`)
}

function run(cmd) {
  console.log(cmd);
  console.log(execSync(cmd).toString());
}

function node(cmd) {
  run(`node ${cmd}`);
}
