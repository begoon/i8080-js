const { execSync } = require('child_process');

if (process.argv.length < 2) process.exit(1);

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

node('rkdump >files.js');
run('type files.js i8080.js i8080_disasm.js i8080_trace.js i8080_test.js main.js > all.js');
