// Part of Intel 8080/KR580VM80A in JavaScript
//
// Copyright (C) 2012 Alexander Demin <alexander@demin.ws>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2, or (at your option)
// any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

class Memory {
  public mem: Uint8Array;

  constructor() {
    this.mem = new Uint8Array(0x10000);
  }

  read(addr) {
    return this.mem[addr & 0xffff];
  }

  write(addr, w8) {
    this.mem[addr & 0xffff] = w8;
  }

  load_file(files, name) {
    if (files[name] == null) {
      i8080Console.log("File " + name + " is not found");
      return;
    }
    var end = files[name].start + files[name].image.length - 1;
    for (var i = files[name].start; i <= end; ++i)
      this.write(i, files[name].image.charCodeAt(i - files[name].start));

      i8080Console.log("*********************************");
    var size = files[name].end - files[name].start + 1;
    i8080Console.log("File \"" + name + "\" loaded, size " + size);
  }
}

class IO {
  input(port) { return 0; }
  output(port, w8) {}
  interrupt(iff) {}
}

function execute_test(filename, success_check) {
  let files = preloaded_files();

  var success = 0;

  var mem = new Memory();
  mem.load_file(files, filename);

  mem.write(5, 0xC9);  // Inject RET at 0x0005 to handle "CALL 5".

  var cpu = new I8080(mem, new IO());

  cpu.jump(0x100);

  while (1) {
    // Enable this line to print out the CPU registers, the current
    // instruction and the mini-dumps addressed by the register pairs.
    // console.log(I8080_trace(cpu));

    // Enable this to be able to interrupt the execution after each
    // instruction.
    // if (!confirm(I8080_trace(cpu))) return;

    var pc = cpu.pc;
    if (mem.read(pc) == 0x76) {
      i8080Console.log("HLT at " + pc.toString(16));
      i8080Console.flush();
      return false;
    }
    if (pc == 0x0005) {
      if (cpu.c == 9) {
        // Print till '$'.
        for (var i = cpu.de(); mem.read(i) != 0x24; i += 1) {
          i8080Console.putchar(mem.read(i));
        }
        success = 1;
      }
      if (cpu.c == 2) i8080Console.putchar(cpu.e);
    }
    cpu.instruction();
    if (cpu.pc == 0) {
      i8080Console.flush();
      i8080Console.log("Jump to 0000 from " + pc.toString(16));
      if (success_check && !success)
        return false;
      return true;
    }
  }
}

function main(enable_exerciser?: boolean) {
  i8080Console.log("Intel 8080/JS test");
  i8080Console.putchar("\n");

  execute_test("TEST.COM", false);
  execute_test("CPUTEST.COM", false);
  execute_test("8080PRE.COM", true);

  // We may want to disable this test because it may take an hour
  // running in the browser. Within the standalone V8 interpreter
  // it works ~30 minutes.
  if (enable_exerciser)
    execute_test("8080EX1.COM", false);
}
