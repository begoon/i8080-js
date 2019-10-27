// Intel 8080 (KR580VM80A) microprocessor core model in JavaScript
//
// Copyright (C) 2012 Alexander Demin <alexander@demin.ws>
//
// Credits
//
// Viacheslav Slavinsky, Vector-06C FPGA Replica
// http://code.google.com/p/vector06cc/
//
// Dmitry Tselikov, Bashrikia-2M and Radio-86RK on Altera DE1
// http://bashkiria-2m.narod.ru/fpga.html
//
// Ian Bartholomew, 8080/8085 CPU Exerciser
// http://www.idb.me.uk/sunhillow/8080.html
//
// Frank Cringle, The original exerciser for the Z80.
//
// Thanks to zx.pk.ru and nedopc.org/forum communities.
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

import {IO} from './io';

import {FLAGS, Register} from './constants';

type RegisterValue = i32;

const REGISTER_START = 0;
const REGISTER_END = REGISTER_START + 8;

const PC_START = REGISTER_END;
const PC_END = PC_START + 4;

const SP_START = PC_END;
const SP_END = SP_START + 4;

const IFF_START = SP_END;
const IFF_END = IFF_START + 4;

const SF_START = IFF_END;
const SF_END = SF_START + 4;

const PF_START = SF_END;
const PF_END = PF_START + 4;

const HF_START = PF_END;
const HF_END = HF_START + 4;

const ZF_START = HF_END;
const ZF_END = ZF_START + 4;

const CF_START = ZF_END;
const CF_END = CF_START + 4;

const CYCLES_START = CF_END;
const CYCLES_END = CYCLES_START + 8;

const MEMORY_START = CYCLES_END;
const MEMORY_END = MEMORY_START + 65536;

export class I8080Base {
  @inline get pc(): u16 {return load<u16>(PC_START);}
  @inline set pc(x: u16) {store<u16>(PC_START, x);}

  @inline get sp(): u16 {return load<u16>(SP_START);}
  @inline set sp(x: u16) {store<u16>(SP_START, x);}

  @inline get iff(): i32 {return load<i32>(IFF_START);}
  @inline set iff(x: i32) {store<i32>(IFF_START, x);}

  @inline get sf(): i32 {return load<i32>(SF_START);}
  @inline set sf(x: i32) {store<i32>(SF_START, x);}

  @inline get pf(): i32 {return load<i32>(PF_START);}
  @inline set pf(x: i32) {store<i32>(PF_START, x);}

  @inline get hf(): i32 {return load<i32>(HF_START);}
  @inline set hf(x: i32) {store<i32>(HF_START, x);}

  @inline get zf(): i32 {return load<i32>(ZF_START);}
  @inline set zf(x: i32) {store<i32>(ZF_START, x);}

  @inline get cf(): i32 {return load<i32>(CF_START);}
  @inline set cf(x: i32) {store<i32>(CF_START, x);}

  @inline static get cycles(): i64 {return load<i64>(CYCLES_START);}
  @inline static set cycles(x: i64) {store<i64>(CYCLES_START, x);}

  // Registers: b, c, d, e, h, l, m, a
  //            0  1  2  3  4  5  6  7

  public io: IO;

  constructor(io: IO) {
    this.io = io;
  }

  @inline half_carry(v: i32): bool { return v >= 4 ?  v != 5 : v == 2;  }
  @inline sub_half_carry(v: i32): bool { return v >= 4 ?  v == 7 : v != 0;  }

  @inline parity(v: i32): bool { return !(popcnt(v) & 0x01); }

  @inline _mem(addr: i32): i32 { return MEMORY_START + addr; }
  @inline getU8(addr: i32): u8 { return load<u8>(this._mem(addr)); }
  @inline getU16(addr: i32): u16 { return load<u16>(this._mem(addr)); }

  @inline setU8(addr: i32, value: u8): void { store<u8>(this._mem(addr), value); }
  @inline setU16(addr: i32, value: u16): void { store<u16>(this._mem(addr), value); }

  @inline memory_read_byte(addr: u16): u8 { return this.getU8(addr); }
  @inline memory_read_word(addr: u16): u16 { return this.getU16(addr); }
  
  @inline memory_write_byte(addr: u16, w8: u8): void { this.setU8(addr, w8); }
  @inline memory_write_word(addr: u16, w16: u16): void { this.setU16(addr, w16); }

  @inline _reg(index: i32): i32 { return REGISTER_START + index; }
  @inline get_regUnsafe(index: i32): u8 { return load<u8>(this._reg(index)); }
  @inline get_rpUnsafe(index: i32): u16 { return bswap<u16>(load<u16>(this._reg(index))); }

  @inline set_regUnsafe(index: i32, value: u8): void { store<u8>(this._reg(index), value); }
  @inline set_rpUnsafe(index: i32, value: u16): void { store<u16>(this._reg(index), bswap<u16>(value)); }

  @inline reg(r: Register): RegisterValue { return r != Register.M ? this.get_regUnsafe(r) : this.memory_read_byte(this.hl); }

  @inline set_reg(r: Register, w8: RegisterValue): void {
    if (r != Register.M) {
      this.set_regUnsafe(r, <u8>w8);
    } else {
      this.memory_write_byte(this.hl, <u8>w8);
    }
  }

  // r - 00 (bc), 01 (de), 10 (hl), 11 (sp)
  @inline rp(r: Register): u16 { return r != Register.M ? this.get_rpUnsafe(r) : this.sp; }

  @inline set_rp(r: Register, w16: u16): void {
    if (r != Register.M) {
      this.set_rpUnsafe(r, w16);
    } else {
      this.sp = w16;
    }
  }

  @inline store_flags(): u8 { return <u8>(this.cf | 1 << 1 | this.pf << 2 | 0 << 3 | this.hf << 4 | 0 << 5 | this.zf << 6 | this.sf << 7); }

  @inline retrieve_flags(f: u8): void {
    this.sf = f & FLAGS.NEG    ? 1 : 0;
    this.zf = f & FLAGS.ZERO   ? 1 : 0;
    this.hf = f & FLAGS.HCARRY ? 1 : 0;
    this.pf = f & FLAGS.PARITY ? 1 : 0;
    this.cf = f & FLAGS.CARRY  ? 1 : 0;
  }

  @inline get bc(): u16 { return this.rp(Register.B); }
  @inline get de(): u16 { return this.rp(Register.D); }
  @inline get hl(): u16 { return this.rp(Register.H); }

  @inline get b(): RegisterValue { return this.reg(Register.B); }
  @inline get c(): RegisterValue { return this.reg(Register.C); }
  @inline get d(): RegisterValue { return this.reg(Register.D); }
  @inline get e(): RegisterValue { return this.reg(Register.E); }
  @inline get h(): RegisterValue { return this.reg(Register.H); }
  @inline get l(): RegisterValue { return this.reg(Register.L); }
  @inline get a(): RegisterValue { return this.reg(Register.A); }

  @inline set b(v: RegisterValue) { this.set_reg(Register.B, v); }
  @inline set c(v: RegisterValue) { this.set_reg(Register.C, v); }
  @inline set d(v: RegisterValue) { this.set_reg(Register.D, v); }
  @inline set e(v: RegisterValue) { this.set_reg(Register.E, v); }
  @inline set h(v: RegisterValue) { this.set_reg(Register.H, v); }
  @inline set l(v: RegisterValue) { this.set_reg(Register.L, v); }
  @inline set a(v: RegisterValue) { this.set_reg(Register.A, v); }

  @inline next_pc_byte(): u8 { return this.memory_read_byte(this.pc++); }

  @inline next_pc_word(): u16 {
    this.pc += 2;
    return this.memory_read_word(this.pc - 2);
  }
}
