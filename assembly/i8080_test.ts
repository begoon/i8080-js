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

import {i8080Console} from './console';
import {preloaded_files, File} from './files';
import {I8080} from './i8080';

export class Memory {
  public mem: Uint8Array;

  constructor() {
    this.mem = new Uint8Array(0x10000);
  }

  read(addr: u16): u8 {
    return this.mem[addr & 0xffff];
  }

  write(addr: u16, w8: u8): void {
    this.mem[addr & 0xffff] = w8;
  }

  load_file(files: Map<string, File>, name: string): void {
    const file = files.get(name);
    if (file == null) {
      i8080Console.log("File " + name + " is not found");
      return;
    }
    var end: u16 = <u16>(file.start + file.image.length - 1);
    for (var i = file.start; i <= end; ++i) {
      this.write(i, file.image[i - file.start]);
    }
    var size = file.end - file.start + 1;
    i8080Console.log("***** File " + name + " loaded, size " + size.toString() + ' *****');
  }
}

export class IO {
  input(port: u8): u8 { return 0; }
  output(port: u8, w8: u8): void {}
  interrupt(iff: bool): void {}
}

function execute_test(filename: string, success_check: boolean): bool {
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
    // console.log((new i8080_trace(cpu)).r);

    // Enable this to be able to interrupt the execution after each
    // instruction.
    // if (!confirm(i8080_trace(cpu))) return;

    var pc = cpu.pc;
    if (mem.read(pc) == 0x76) {
      i8080Console.log("HLT at " + pc.toString()) // ! 16));
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
      i8080Console.log("Jump to 0000 from " + pc.toString()) // 16));
      if (success_check && !success)
        return false;
      return true;
    }
  }
  return false;
}

export function main(enable_exerciser: boolean = false): void {
  i8080Console.log("Intel 8080/JS test");
  i8080Console.putchar(<u8>("\n".charCodeAt(0)));

  execute_test("TEST.COM", false);
  execute_test("CPUTEST.COM", false);
  execute_test("8080PRE.COM", true);

  // We may want to disable this test because it may take an hour
  // running in the browser. Within the standalone V8 interpreter
  // it works ~30 minutes.
  if (enable_exerciser) {
    execute_test("8080EX1.COM", false);
  }
}
