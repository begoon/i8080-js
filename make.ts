const { spawn } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);

if (args.length === 0) args.push("all");

let _ = tasks();

if (args[0] === "?") _.help();
else {
  (async () => {
    for (arg of args) await _[arg]();
  })();
}

function tasks() {

let _ = {};

_.help = async function() {
  console.log(Object.keys(_));
}

_.test = async function() { 
  await _.node("all.js"); 
}

_.all = async function() {
  await _.files();
  await _.build(false);
  await _.timeit(_.test);
}

_.ex1 = async function() {
  await _.files();
  await _.build(true);
  await _.timeit(_.test);
}

_.build = async function(ex1) {
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

_.files = async function() {
  await _.node('rkdump >files.js');
}

// -------------------------------------

_.timeit = async function(cb) {
  const { performance } = require('perf_hooks');
  const started = performance.now();
  await cb();
  const duration = (performance.now() - started) / 1000;
  console.log(`${duration.toFixed(2)}(s) ${(duration / 60).toFixed(2)}(m)`)
}

_.run = async function(cmd) {
  console.log(cmd);
  const exe = await spawn(cmd, [], { shell: true });
  exe.on("error", (code) => { console.log("error", code) });
  exe.on("exit", (code) => { console.log("exited", code); });
  exe.stderr.on("data", (data) => { console.log("ERROR", data.toString())});

  for await (line of exe.stdout) {
    process.stdout.write(line.toString()); 
  }
}

_.node = async function(cmd) {
  await _.run(`node ${cmd}`);
}

return _;
}
