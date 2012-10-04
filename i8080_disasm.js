// Intel 8080 (KR580VM80A) disassember in JavaScript
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

String.prototype.repeat = function (sz) {
  for (var o = []; sz > 0; o[--sz] = this); 
  return(o.join(''));
}

String.prototype.format = function () {
  var i = 0, a, f = this, o = [], m, p, c, x;
  while (f) {
    if (m = /^[^\x25]+/.exec(f)) o.push(m[0]);
    else if (m = /^\x25{2}/.exec(f)) o.push('%');
    else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
      if (((a = arguments[m[1] || i++]) == null) || (a == undefined))
        throw("Format: Too few arguments")
      if (/[^s]/.test(m[7]) && (typeof(a) != 'number'))
        throw("Expecting number but found " + typeof(a));
      switch (m[7]) {
        case 'b': a = a.toString(2); break;
        case 'c': a = String.fromCharCode(a); break;
        case 'd': a = parseInt(a); break;
        case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
        case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
        case 'o': a = a.toString(8); break;
        case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
        case 'u': a = Math.abs(a); break;
        case 'x': a = a.toString(16); break;
        case 'X': a = a.toString(16).toUpperCase(); break;
      }
      a = (/[def]/.test(m[7]) && m[2] && a > 0 ? '+' + a : a);
      c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
      x = m[5] - String(a).length;
      p = m[5] ? c.repeat(x) : '';
      o.push(m[4] ? a + p : p + a);
    }
    else throw ("Huh ?!");
    f = f.substring(m[0].length);
  }
  return o.join('');
}

I8080_disasm = function (binary) {
  var opcode = binary[0];
  var imm8 = binary[1];
  var imm16 = imm8 | (binary[2] << 8);
  var cmd, length, arg1, arg2, code, data1, data2, bad;

  var fmt8 = "%02X";
  var fmt16 = "%04X";

  imm8 = fmt8.format(imm8);
  imm16 = fmt16.format(imm16);

  switch (opcode) {
    case 0x00: cmd = "NOP";   length = 1; break;
    case 0x08: cmd = "NOP?";  length = 1; bad = true; break;
    case 0x10: cmd = "NOP?";  length = 1; bad = true; break;
    case 0x20: cmd = "NOP?";  length = 1; bad = true; break;
    case 0x18: cmd = "NOP?";  length = 1; bad = true; break;
    case 0x28: cmd = "NOP?";  length = 1; bad = true; break;
    case 0x30: cmd = "NOP?";  length = 1; bad = true; break;
    case 0x38: cmd = "NOP?";  length = 1; bad = true; break;

    case 0x01: cmd = "LXI";   length = 3; arg1 = "B"; arg2 = imm16; data2 = true; break;
    case 0x02: cmd = "STAX";  length = 1; arg1 = "B"; break;
    case 0x03: cmd = "INX";   length = 1; arg1 = "B"; break;
    case 0x04: cmd = "INR";   length = 1; arg1 = "B"; break;
    case 0x05: cmd = "DCR";   length = 1; arg1 = "B"; break;
    case 0x06: cmd = "MVI";   length = 2; arg1 = "B"; arg2 = imm8; break;
    case 0x07: cmd = "RLC";   length = 1; break;
    case 0x09: cmd = "DAD";   length = 1; arg1 = "B"; break;
    case 0x0a: cmd = "LDAX";  length = 1; arg1 = "B"; break;
    case 0x0b: cmd = "DCX";   length = 1; arg1 = "B"; break;
    case 0x0c: cmd = "INR";   length = 1; arg1 = "C"; break;
    case 0x0d: cmd = "DCR";   length = 1; arg1 = "C"; break;
    case 0x0e: cmd = "MVI";   length = 2; arg1 = "C"; arg2 = imm8; break;
    case 0x0f: cmd = "RRC";   length = 1; break;

    case 0x11: cmd = "LXI";   length = 3; arg1 = "D"; arg2 = imm16; data2 = true; break;
    case 0x12: cmd = "STAX";  length = 1; arg1 = "D"; break;
    case 0x13: cmd = "INX";   length = 1; arg1 = "D"; break;
    case 0x14: cmd = "INR";   length = 1; arg1 = "D"; break;
    case 0x15: cmd = "DCR";   length = 1; arg1 = "D"; break;
    case 0x16: cmd = "MVI";   length = 2; arg1 = "D"; arg2 = imm8; break;
    case 0x17: cmd = "RAL";   length = 1; break;
    case 0x19: cmd = "DAD";   length = 1; arg1 = "D"; break;
    case 0x1a: cmd = "LDAX";  length = 1; arg1 = "D"; break;
    case 0x1b: cmd = "DCX";   length = 1; arg1 = "D"; break;
    case 0x1c: cmd = "INR";   length = 1; arg1 = "E"; break;
    case 0x1d: cmd = "DCR";   length = 1; arg1 = "E"; break;
    case 0x1e: cmd = "MVI";   length = 2; arg1 = "E"; arg2 = imm8; break;
    case 0x1f: cmd = "RAR";   length = 1; break;

    case 0x21: cmd = "LXI";   length = 3; arg1 = "H"; arg2 = imm16; data2 = true; break;
    case 0x22: cmd = "SHLD";  length = 3; arg1 = imm16; data1 = true; break;
    case 0x23: cmd = "INX";   length = 1; arg1 = "H"; break;
    case 0x24: cmd = "INR";   length = 1; arg1 = "H"; break;
    case 0x25: cmd = "DCR";   length = 1; arg1 = "H"; break;
    case 0x26: cmd = "MVI";   length = 2; arg1 = "H"; arg2 = imm8; break;
    case 0x27: cmd = "DAA";   length = 1; break;
    case 0x29: cmd = "DAD";   length = 1; arg1 = "H"; break;
    case 0x2a: cmd = "LHLD";  length = 3; arg1 = imm16; data1 = true; break;
    case 0x2b: cmd = "DCX";   length = 1; arg1 = "H"; break;
    case 0x2c: cmd = "INR";   length = 1; arg1 = "L"; break;
    case 0x2d: cmd = "DCR";   length = 1; arg1 = "L"; break;
    case 0x2e: cmd = "MVI";   length = 2; arg1 = "L"; arg2 = imm8; break;
    case 0x2f: cmd = "CMA";   length = 1; break;

    case 0x31: cmd = "LXI";   length = 3; arg1 = "SP"; arg2 = imm16; data2 = true; break;
    case 0x32: cmd = "STA";   length = 3; arg1 = imm16; data1 = true; break;
    case 0x33: cmd = "INX";   length = 1; arg1 = "SP"; break;
    case 0x34: cmd = "INR";   length = 1; arg1 = "M"; break;
    case 0x35: cmd = "DCR";   length = 1; arg1 = "M"; break;
    case 0x36: cmd = "MVI";   length = 2; arg1 = "M"; arg2 = imm8; break;
    case 0x37: cmd = "STC";   length = 1; break;
    case 0x39: cmd = "DAD";   length = 1; arg1 = "SP"; break;
    case 0x3a: cmd = "LDA";   length = 3; arg1 = imm16; data1 = true; break;
    case 0x3b: cmd = "DCX";   length = 1; arg1 = "SP"; break;
    case 0x3c: cmd = "INR";   length = 1; arg1 = "A"; break;
    case 0x3d: cmd = "DCR";   length = 1; arg1 = "A"; break;
    case 0x3e: cmd = "MVI";   length = 2; arg1 = "A"; arg2 = imm8; break;
    case 0x3f: cmd = "CMC";   length = 1; break;

    case 0x76: cmd = "HLT";   length = 1; break;

    case 0xc3: cmd = "JMP";   length = 3; arg1 = imm16; branch = true; break;
    case 0xcb: cmd = "JMP?";  length = 3; arg1 = imm16; branch = true; bad = true; break;

    case 0xcd: cmd = "CALL";  length = 3; arg1 = imm16; branch = true; break;
    case 0xfd: cmd = "CALL?"; length = 3; arg1 = imm16; branch = true; bad = true; break;

    case 0xc9: cmd = "RET";   length = 1; break;

    case 0x40: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "B"; break;
    case 0x41: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "C"; break;
    case 0x42: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "D"; break;
    case 0x43: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "E"; break;
    case 0x44: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "H"; break;
    case 0x45: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "L"; break;
    case 0x46: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "M"; break;
    case 0x47: cmd = "MOV";   length = 1; arg1 = "B"; arg2 = "A"; break;
    case 0x48: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "B"; break;
    case 0x49: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "C"; break;
    case 0x4a: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "D"; break;
    case 0x4b: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "E"; break;
    case 0x4c: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "H"; break;
    case 0x4d: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "L"; break;
    case 0x4e: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "M"; break;
    case 0x4f: cmd = "MOV";   length = 1; arg1 = "C"; arg2 = "A"; break;

    case 0x50: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "B"; break;
    case 0x51: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "C"; break;
    case 0x52: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "D"; break;
    case 0x53: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "E"; break;
    case 0x54: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "H"; break;
    case 0x55: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "L"; break;
    case 0x56: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "M"; break;
    case 0x57: cmd = "MOV";   length = 1; arg1 = "D"; arg2 = "A"; break;
    case 0x58: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "B"; break;
    case 0x59: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "C"; break;
    case 0x5a: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "D"; break;
    case 0x5b: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "E"; break;
    case 0x5c: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "H"; break;
    case 0x5d: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "L"; break;
    case 0x5e: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "M"; break;
    case 0x5f: cmd = "MOV";   length = 1; arg1 = "E"; arg2 = "A"; break;

    case 0x60: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "B"; break;
    case 0x61: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "C"; break;
    case 0x62: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "D"; break;
    case 0x63: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "E"; break;
    case 0x64: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "H"; break;
    case 0x65: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "L"; break;
    case 0x66: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "M"; break;
    case 0x67: cmd = "MOV";   length = 1; arg1 = "H"; arg2 = "A"; break;
    case 0x68: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "B"; break;
    case 0x69: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "C"; break;
    case 0x6a: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "D"; break;
    case 0x6b: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "E"; break;
    case 0x6c: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "H"; break;
    case 0x6d: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "L"; break;
    case 0x6e: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "M"; break;
    case 0x6f: cmd = "MOV";   length = 1; arg1 = "L"; arg2 = "A"; break;

    case 0x70: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "B"; break;
    case 0x71: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "C"; break;
    case 0x72: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "D"; break;
    case 0x73: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "E"; break;
    case 0x74: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "H"; break;
    case 0x75: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "L"; break;

    case 0x0f: cmd = "HLT";   length = 1; break;

    case 0x77: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "A"; break;
    case 0x78: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "B"; break;
    case 0x79: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "C"; break;
    case 0x7a: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "D"; break;
    case 0x7b: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "E"; break;
    case 0x7c: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "H"; break;
    case 0x7d: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "L"; break;
    case 0x7e: cmd = "MOV";   length = 1; arg1 = "A"; arg2 = "M"; break;
    case 0x7f: cmd = "MOV";   length = 1; arg1 = "M"; arg2 = "M"; break;

    case 0x80: cmd = "ADD";   length = 1; arg1 = "B"; break;
    case 0x81: cmd = "ADD";   length = 1; arg1 = "C"; break;
    case 0x82: cmd = "ADD";   length = 1; arg1 = "D"; break;
    case 0x83: cmd = "ADD";   length = 1; arg1 = "E"; break;
    case 0x84: cmd = "ADD";   length = 1; arg1 = "H"; break;
    case 0x85: cmd = "ADD";   length = 1; arg1 = "L"; break;
    case 0x86: cmd = "ADD";   length = 1; arg1 = "M"; break;
    case 0x87: cmd = "ADD";   length = 1; arg1 = "A"; break;
    case 0x88: cmd = "ADC";   length = 1; arg1 = "B"; break;
    case 0x89: cmd = "ADC";   length = 1; arg1 = "C"; break;
    case 0x8a: cmd = "ADC";   length = 1; arg1 = "D"; break;
    case 0x8b: cmd = "ADC";   length = 1; arg1 = "E"; break;
    case 0x8c: cmd = "ADC";   length = 1; arg1 = "H"; break;
    case 0x8d: cmd = "ADC";   length = 1; arg1 = "L"; break;
    case 0x8e: cmd = "ADC";   length = 1; arg1 = "M"; break;
    case 0x8f: cmd = "ADC";   length = 1; arg1 = "A"; break;

    case 0x90: cmd = "SUB";   length = 1; arg1 = "B"; break;
    case 0x91: cmd = "SUB";   length = 1; arg1 = "C"; break;
    case 0x92: cmd = "SUB";   length = 1; arg1 = "D"; break;
    case 0x93: cmd = "SUB";   length = 1; arg1 = "E"; break;
    case 0x94: cmd = "SUB";   length = 1; arg1 = "H"; break;
    case 0x95: cmd = "SUB";   length = 1; arg1 = "L"; break;
    case 0x96: cmd = "SUB";   length = 1; arg1 = "M"; break;
    case 0x97: cmd = "SUB";   length = 1; arg1 = "A"; break;
    case 0x98: cmd = "SBB";   length = 1; arg1 = "B"; break;
    case 0x99: cmd = "SBB";   length = 1; arg1 = "C"; break;
    case 0x9a: cmd = "SBB";   length = 1; arg1 = "D"; break;
    case 0x9b: cmd = "SBB";   length = 1; arg1 = "E"; break;
    case 0x9c: cmd = "SBB";   length = 1; arg1 = "H"; break;
    case 0x9d: cmd = "SBB";   length = 1; arg1 = "L"; break;
    case 0x9e: cmd = "SBB";   length = 1; arg1 = "M"; break;
    case 0x9f: cmd = "SBB";   length = 1; arg1 = "A"; break;

    case 0xa0: cmd = "ANA";   length = 1; arg1 = "B"; break;
    case 0xa1: cmd = "ANA";   length = 1; arg1 = "C"; break;
    case 0xa2: cmd = "ANA";   length = 1; arg1 = "D"; break;
    case 0xa3: cmd = "ANA";   length = 1; arg1 = "E"; break;
    case 0xa4: cmd = "ANA";   length = 1; arg1 = "H"; break;
    case 0xa5: cmd = "ANA";   length = 1; arg1 = "L"; break;
    case 0xa6: cmd = "ANA";   length = 1; arg1 = "M"; break;
    case 0xa7: cmd = "ANA";   length = 1; arg1 = "A"; break;
    case 0xa8: cmd = "XRA";   length = 1; arg1 = "B"; break;
    case 0xa9: cmd = "XRA";   length = 1; arg1 = "C"; break;
    case 0xaa: cmd = "XRA";   length = 1; arg1 = "D"; break;
    case 0xab: cmd = "XRA";   length = 1; arg1 = "E"; break;
    case 0xac: cmd = "XRA";   length = 1; arg1 = "H"; break;
    case 0xad: cmd = "XRA";   length = 1; arg1 = "L"; break;
    case 0xae: cmd = "XRA";   length = 1; arg1 = "M"; break;
    case 0xaf: cmd = "XRA";   length = 1; arg1 = "A"; break;

    case 0xb0: cmd = "ORA";   length = 1; arg1 = "B"; break;
    case 0xb1: cmd = "ORA";   length = 1; arg1 = "C"; break;
    case 0xb2: cmd = "ORA";   length = 1; arg1 = "D"; break;
    case 0xb3: cmd = "ORA";   length = 1; arg1 = "E"; break;
    case 0xb4: cmd = "ORA";   length = 1; arg1 = "H"; break;
    case 0xb5: cmd = "ORA";   length = 1; arg1 = "L"; break;
    case 0xb6: cmd = "ORA";   length = 1; arg1 = "M"; break;
    case 0xb7: cmd = "ORA";   length = 1; arg1 = "A"; break;
    case 0xb8: cmd = "CMP";   length = 1; arg1 = "B"; break;
    case 0xb9: cmd = "CMP";   length = 1; arg1 = "C"; break;
    case 0xba: cmd = "CMP";   length = 1; arg1 = "D"; break;
    case 0xbb: cmd = "CMP";   length = 1; arg1 = "E"; break;
    case 0xbc: cmd = "CMP";   length = 1; arg1 = "H"; break;
    case 0xbd: cmd = "CMP";   length = 1; arg1 = "L"; break;
    case 0xbe: cmd = "CMP";   length = 1; arg1 = "M"; break;
    case 0xbf: cmd = "CMP";   length = 1; arg1 = "A"; break;

    case 0xc0: cmd = "RNZ";   length = 1; break;
    case 0xc1: cmd = "POP";   length = 1; arg1 = "B"; break;
    case 0xc2: cmd = "JNZ";   length = 3; arg1 = imm16; branch = true; break;

    case 0xc3: cmd = "JMP";   length = 3; arg1 = imm16; branch = true; break;
    case 0xcb: cmd = "JMP?";  length = 3; arg1 = imm16; branch = true; bad = true; break;

    case 0xc4: cmd = "CNZ";   length = 3; arg1 = imm16; branch = true; break;
    case 0xc5: cmd = "PUSH";  length = 1; arg1 = "B"; break;
    case 0xc6: cmd = "ADI";   length = 2; arg1 = imm8; break;
    case 0xc7: cmd = "RST";   length = 1; arg1 = "0"; break;
    case 0xc8: cmd = "RZ";    length = 1; break;

    case 0xc9: cmd = "RET";   length = 1; break;
    case 0xd9: cmd = "RET?";  length = 1; bad = true; break;

    case 0xca: cmd = "JZ";    length = 3; arg1 = imm16; branch = true; break;
    case 0xcc: cmd = "CZ";    length = 3; arg1 = imm16; branch = true; break;

    case 0xcd: cmd = "CALL";  length = 3; arg1 = imm16; branch = true; break;
    case 0xdd: cmd = "CALL?"; length = 3; arg1 = imm16; branch = true; bad = true; break;
    case 0xed: cmd = "CALL?"; length = 3; arg1 = imm16; branch = true; bad = true; break;
    case 0xfd: cmd = "CALL?"; length = 3; arg1 = imm16; branch = true; bad = true; break;

    case 0xce: cmd = "ACI";   length = 2; arg1 = imm8; break;
    case 0xcf: cmd = "RST";   length = 1; arg1 = "1"; break;
    case 0xd0: cmd = "RNC";   length = 1; break;
    case 0xd1: cmd = "POP";   length = 1; arg1 = "D"; break;
    case 0xd2: cmd = "JNC";   length = 3; arg1 = imm16; branch = true; break;
    case 0xd3: cmd = "OUT";   length = 2; arg1 = imm8; break;
    case 0xd4: cmd = "CNC";   length = 3; arg1 = imm16; branch = true; break;
    case 0xd5: cmd = "PUSH";  length = 1; arg1 = "D"; break;
    case 0xd6: cmd = "SUI";   length = 2; arg1 = imm8; break;
    case 0xd7: cmd = "RST";   length = 1; arg1 = "2"; break;
    case 0xd8: cmd = "RC";    length = 1; break;
    case 0xda: cmd = "JC";    length = 3; arg1 = imm16; branch = true; break;
    case 0xdb: cmd = "IN";    length = 2; arg1 = imm8; break;
    case 0xdc: cmd = "CC";    length = 3; arg1 = imm16; branch = true; break;
    case 0xde: cmd = "SBI";   length = 2; arg1 = imm8; break;
    case 0xdf: cmd = "RST";   length = 1; arg1 = "3"; break;
    case 0xe0: cmd = "RPO";   length = 1; break;
    case 0xe1: cmd = "POP";   length = 1; arg1 = "H"; break;
    case 0xe2: cmd = "JPO";   length = 3; arg1 = imm16; branch = true; break;
    case 0xe3: cmd = "XTXL";  length = 1; break;
    case 0xe4: cmd = "CPO";   length = 3; arg1 = imm16; branch = true; break;
    case 0xe5: cmd = "PUSH";  length = 1; arg1 = "H"; break;
    case 0xe6: cmd = "ANI";   length = 2; arg1 = imm8; break;
    case 0xe7: cmd = "RST";   length = 1; arg1 = "4"; break;
    case 0xe8: cmd = "RPE";   length = 1; break;
    case 0xe9: cmd = "PCHL";  length = 1; break;
    case 0xea: cmd = "JPE";   length = 3; arg1 = imm16; branch = true; break;
    case 0xeb: cmd = "XCHG";  length = 1; break;
    case 0xec: cmd = "CPE";   length = 3; arg1 = imm16; branch = true; break;
    case 0xee: cmd = "XRI";   length = 2; arg1 = imm8; break;
    case 0xef: cmd = "RST";   length = 1; arg1 = "5"; break;
    case 0xf0: cmd = "RP";    length = 1; break;
    case 0xf1: cmd = "POP";   length = 1; arg1 = "PSW"; break;
    case 0xf2: cmd = "JP";    length = 3; arg1 = imm16; branch = true; break;
    case 0xf3: cmd = "DI";    length = 1; break;
    case 0xf4: cmd = "CP";    length = 3; arg1 = imm16; branch = true; break;
    case 0xf5: cmd = "PUSH";  length = 1; arg1 = "PSW"; break;
    case 0xf6: cmd = "ORI";   length = 2; arg1 = imm8; break;
    case 0xf7: cmd = "RST";   length = 1; arg1 = "6"; break;
    case 0xf8: cmd = "RM";    length = 1; break;
    case 0xf9: cmd = "SPHL";  length = 1; break;
    case 0xfa: cmd = "JM";    length = 3; arg1 = imm16; branch = true; break;
    case 0xfb: cmd = "EI";    length = 1; break;
    case 0xfc: cmd = "CM";    length = 3; arg1 = imm16; branch = true; break;
    case 0xfe: cmd = "CPI";   length = 2; arg1 = imm8; break;
    case 0xff: cmd = "RST";   length = 1; arg1 = "7"; break;

    default:
      alert("Unknown opcode: %02X".format(opcode));
      return null;
  };

  var text = cmd;
  if (arg1) text += " " + arg1;
  if (arg2) text += ", " +arg2;

  return {
    cmd: cmd, length: length, arg1: arg1, arg2: arg2,
    code: code, data1: data1, data2: data2, bad: bad,
    text: text
  }
}
