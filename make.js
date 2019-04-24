const { execSync } = require('child_process');
const fs = require('fs');

if (process.argv.length < 2) process.exit(1);

let args = process.argv.slice(2);

let cmd = args.length ? args[0] : "all";
console.log(cmd, args);

if (cmd == "all") {
  node('rkdump >files.js');
  build();
}

if (cmd == 'clean-git') {
  run('git clean -dfx');
}

if (cmd == 'build') {
  build();
}

function build() {
  const files = ['files.js', 'i8080.js', 'i8080_disasm.js', 'i8080_trace.js', 'i8080_test.js', 'main.js'];
  let contents = [];
  files.forEach((name) => {
    contents.push(fs.readFileSync(name));
    console.log(name, contents[contents.length - 1].length);
  });
  const raw = Buffer.concat(contents);
  console.log("all.js", raw.length);
  fs.writeFileSync("all.js", raw);
}

function run(cmd) {
  console.log(`${cmd}`);
  execSync(`${cmd}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    stdout ? console.log(stdout) : void 0;
    if (stderr) {
      console.log(`stderr:\n${stderr}`);
      process.exit(2);
    }
  });
}

function node(cmd) {
  run(`node ${cmd}`);
}
