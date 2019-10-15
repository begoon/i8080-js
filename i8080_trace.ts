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

var I8080_trace = function(i8080) {
  this.hex = function(n, pad) {
    var hex = Number(n).toString(16).toUpperCase();;
    pad = typeof (pad) === "undefined" || pad === null ? pad = 2 : pad;
    while (hex.length < pad) hex = "0" + hex;
    return hex;
  }

  var r = "";

  r +=
    "PC=" + this.hex(i8080.pc, 4) + " " + 
    "[" + this.hex(i8080.memory_read_byte(i8080.pc)) + "] " +
    "A=" + this.hex(i8080.a()) + " " + 
    "F=" + this.hex(i8080.store_flags()) +
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

    "BC=" + this.hex(i8080.bc(), 4) + " " +
    "DE=" + this.hex(i8080.de(), 4) + " " +
    "HL=" + this.hex(i8080.hl(), 4) + " " +
    "SP=" + this.hex(i8080.sp, 4) + " " +
    "\n";

  code = [];
  for (var i = 0; i < 3; ++i)
    code[code.length] = i8080.memory.read(i8080.pc + i);

  var instr = i8080_disasm(code);
  r += this.hex(i8080.pc, 4) + " " + instr.text;
  r += "\n";

  this.dump_mem = function(addr, title) {
    var r = title + ": ";
    for (var i = 0; i < 16; ++i) 
      r += this.hex(i8080.memory.read(addr + i)) + " ";
    r += "\n";
    return r;
  }

  r += this.dump_mem(i8080.pc, "PC");
  r += this.dump_mem(i8080.sp, "SP");
  r += this.dump_mem(i8080.hl(), "HL");
  r += this.dump_mem(i8080.de(), "DE");
  r += this.dump_mem(i8080.bc(), "BC");

  return r;
}
