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
import {Memory} from './memory';

import {FLAGS, Register} from './constants';

type RegisterValue = i32;

export class I8080Base {
  public pc: u16 = 0;
  public sp: u16 = 0;
  public iff: i32 = 0;

  public sf: i32;
  public pf: i32;
  public hf: i32;
  public zf: i32;
  public cf: i32;

  public flags: i32;

  // Registers: b, c, d, e, h, l, m, a
  //            0  1  2  3  4  5  6  7

  public half_carry_table: bool[] = [ 0, 0, 1, 0, 1, 0, 1, 1 ];
  public sub_half_carry_table: bool[] = [ 0, 1, 1, 1, 0, 0, 0, 1 ];

  public memoryStart: u32;
  public regsStart: u32;
  public io: IO;

  constructor(memory: Memory, io: IO) {
    this.memoryStart = memory.dataStart;
    const regsArray = new Uint8Array(8);
    const regsView = new DataView(regsArray.buffer)
    this.regsStart = regsView.dataStart;
    this.io = io;
  }

  @inline parity(v: i32): bool { return !(popcnt(v) & 0x01); }

  @inline getU8(byteOffset: i32): u8 { return load<u8>(this.memoryStart + byteOffset); }
  @inline getU16(byteOffset: i32): u16 { return load<u16>(this.memoryStart + byteOffset); }

  @inline setU8(byteOffset: i32, value: u8): void { store<u8>(this.memoryStart + byteOffset, value); }
  @inline setU16(byteOffset: i32, value: u16): void { store<u16>(this.memoryStart + byteOffset, value); }

  @inline memory_read_byte(addr: u16): u8 { return this.getU8(addr); }
  @inline memory_read_word(addr: u16): u16 { return this.getU16(addr); }
  
  @inline memory_write_byte(addr: u16, w8: u8): void { this.setU8(addr, w8); }
  @inline memory_write_word(addr: u16, w16: u16): void { this.setU16(addr, w16); }

  @inline get_regUnsafe(byteOffset: i32): u8 { return load<u8>(this.regsStart + <usize>byteOffset); }
  @inline get_rpUnsafe(byteOffset: i32): u16 { return bswap<u16>(load<u16>(this.regsStart + <usize>byteOffset)); }

  @inline set_regUnsafe(byteOffset: i32, value: u8): void { store<u8>(this.regsStart + <usize>byteOffset, value); }
  @inline set_rpUnsafe(byteOffset: i32, value: u16): void { store<u16>(this.regsStart + <usize>byteOffset, bswap<u16>(value)); }

  @inline reg(r: Register): RegisterValue {
    return r != Register.M ? this.get_regUnsafe(r) : this.memory_read_byte(this.hl);
  }

  @inline set_reg(r: Register, w8: RegisterValue): void {
    if (r != Register.M) {
      this.set_regUnsafe(r, <u8>w8);
    } else {
      this.memory_write_byte(this.hl, <u8>w8);
    }
  }

  // r - 00 (bc), 01 (de), 10 (hl), 11 (sp)
  @inline rp(r: Register): u16 {
    return r != Register.M ? this.get_rpUnsafe(r) : this.sp;
  }

  @inline set_rp(r: Register, w16: u16): void {
    if (r != Register.M) {
      this.set_rpUnsafe(r, w16);
    } else {
      this.sp = w16;
    }
  }

  @inline store_flags(): u8 {
    return <u8>(this.cf | 1 << 1 | this.pf << 2 | 0 << 3 | this.hf << 4 | 0 << 5 | this.zf << 6 | this.sf << 7);
  }

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
