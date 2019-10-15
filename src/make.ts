const { spawn } = require('child_process');
import * as fs from 'fs';

const args = process.argv.slice(2);

if (args.length === 0) args.push("all");

let _: any = tasks();

if (args[0] === "?") _.help();
else {
  (async () => {
    for (let arg of args) await _[arg]();
  })();
}

function tasks() {

  let _ = {
    help() {
      console.log(Object.keys(_));
    },
    test: async function() {
      await this.node("all.js");
    },

    all: async function() {
      await _.files();
      await _.build(false);
      await _.timeit(_.test);
    },

    ex1: async function() {
      await _.files();
      await _.build(true);
      await _.timeit(_.test);
    },

    build: async function(ex1: boolean) {
      const files = ['files.js', 'i8080.js', 'i8080_disasm.js', 'i8080_trace.js', 'i8080_test.js'];
      files.push(ex1 ? "main_ex1.js" : "main.js");
      let contents: Buffer[] = [];
      console.log(files);
      files.forEach((name) => {
        contents.push(fs.readFileSync(name));
        console.log(name, contents[contents.length - 1].length);
      });
      const raw = Buffer.concat(contents);
      console.log("all.js", raw.length);
      fs.writeFileSync("all.js", raw);
    },

    files: async function() {
      await this.node('rkdump >files.js');
    },

    // -------------------------------------

    timeit: async function(cb: () => void) {
      const { performance } = require('perf_hooks');
      const started = performance.now();
      await cb();
      const duration = (performance.now() - started) / 1000;
      console.log(`${duration.toFixed(2)}(s) ${(duration / 60).toFixed(2)}(m)`)
    },

    run: async function(cmd: string) {
      console.log(cmd);
      const exe = await spawn(cmd, [], { shell: true });
      exe.on("error", (code: string) => { console.log("error", code) });
      exe.on("exit", (code: string) => { console.log("exited", code); });
      exe.stderr.on("data", (data: string) => { console.log("ERROR", data.toString())});

      for await (let line of exe.stdout) {
        process.stdout.write(line.toString());
      }
    },

    node: async function(cmd: string) {
      await _.run(`node ${cmd}`);
    }
  }
  return _;
}
