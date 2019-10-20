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
import {I8080} from './i8080';
import {hex8, hex16} from './utils';
import {i8080_disasm} from './i8080_disasm';

export class I8080_trace {
  public r: string = "";
  public i8080: I8080;
  constructor(i8080: I8080) {
    this.i8080 = i8080;
    this.r +=
    "PC=" + this.hex16(this.i8080.pc) + " " + 
    "[" + this.hex8(this.i8080.memory_read_byte(i8080.pc)) + "] " +
    "A=" + this.hex8(this.i8080.a) + " " + 
    "F=" + this.hex8(this.i8080.store_flags()) +
    " " + 
    (i8080.sf ? "S" : "-") +
    (i8080.zf ? "Z" : "-") +
    "0" +
    (i8080.hf ? "H" : "-") +
    "0" +
    (i8080.pf ? "P" : "-") +
    "1" +
    (i8080.cf ? "C" : "-") +
    "\n" +

    "BC = " + this.hex16(this.i8080.bc) + " " + "DE = " + this.hex16(this.i8080.de) + " " + "HL = " + this.hex16(this.i8080.hl) + " " + "SP = " + this.hex16(this.i8080.sp) + " " + "\n";

    let code: u8[] = new Array(4);
    const len = 0x10000;
    for (let i: u16 = 0; i < 3; i++) {
      let byte = i8080.memory_read_byte(<u16>i8080.pc + i);
      code[i] = byte;
    }
    let instr = i8080_disasm(code);
    this.r += this.hex16(this.i8080.pc) + " " + instr;
    this.r += "\n";

    this.r += 'PC: ' + this.dump_mem(this.i8080.pc);
    this.r += 'SP: ' + this.dump_mem(this.i8080.sp);
    this.r += 'HL: ' + this.dump_mem(this.i8080.hl);
    this.r += 'DE: ' + this.dump_mem(this.i8080.de);
    this.r += 'BC: ' + this.dump_mem(this.i8080.bc);
  }

  hex16(n: u16): string {
    var hex = hex16(n);
    while (hex.length < 4) hex = "0" + hex;
    return hex;
  }

  hex8(n: i32): string {
    var hex = hex8(<u8>n);
    return hex;
  }

  dump_mem(addr: u16): string {
    const memStrings: string[] = [];
    for (let i: u16 = 0; i < 16; ++i) {
      memStrings.push(this.hex8(this.i8080.memory_read_byte(addr + i)));
    }
    return memStrings.join(' ') + '\n';
  }
}
