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
  public iff: bool = 0;

  public sf: i32;
  public pf: i32;
  public hf: i32;
  public zf: i32;
  public cf: bool;

  // Registers: b, c, d, e, h, l, m, a
  //            0  1  2  3  4  5  6  7
  public regs: RegisterValue[] = [0, 0, 0, 0, 0, 0, 0, 0];

  public parity_table: bool[] = [
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
  ];
  
  public half_carry_table: bool[] = [ 0, 0, 1, 0, 1, 0, 1, 1 ];
  public sub_half_carry_table: bool[] = [ 0, 1, 1, 1, 0, 0, 0, 1 ];

  public memoryRaw: DataView;
  public io: IO;

  constructor(memory: Memory, io: IO) {
    this.memoryRaw = memory;
    this.io = io;
  }

  @inline
  memory_read_byte(addr: u16): u8 {
    return this.memoryRaw.getUint8Unsafe(addr);
  }

  @inline
  memory_write_byte(addr: u16, w8: u8): void {
    this.memoryRaw.setUint8Unsafe(addr, w8);
  }

  @inline
  memory_read_word(addr: u16): u16 {
    return this.memoryRaw.getUint16Unsafe(addr, true);
  }


  @inline
  memory_write_word(addr: u16, w16: u16): void {
    this.memoryRaw.setUint16Unsafe(addr, w16, true);
  }

  @inline
  reg(r: Register): RegisterValue {
    return r != Register.M ? unchecked(this.regs[r]) : this.memory_read_byte(this.hl);
  }

  @inline
  set_reg(r: Register, w8: RegisterValue): void {
    w8 &= 0xff;
    if (r != Register.M)
      unchecked(this.regs[r] = w8);
    else
      this.memory_write_byte(this.hl, <u8>w8);
  }

  // r - 00 (bc), 01 (de), 10 (hl), 11 (sp)
  @inline
  rp(r: Register): u16 {
    return r != Register.M ? ((<u16>unchecked(this.regs[r]) << 8) | <u16>unchecked(this.regs[r + 1])) : this.sp;
  }

  @inline
  set_rp(r: Register, w16: u16): void {
    if (r != Register.M) {
      this.set_reg(r, <u8>(w16 >> 8));
      this.set_reg(r + 1, <u8>w16);
    } else
      this.sp = w16;
  }

  store_flags(): u8 {
    return <u8>(this.cf | 1 << 1 | this.pf << 2 | 0 << 3 | this.hf << 4 | 0 << 5 | this.zf << 6 | this.sf << 7);
  }

  retrieve_flags(f: u8): void {
    this.sf = f & FLAGS.NEG    ? 1 : 0;
    this.zf = f & FLAGS.ZERO   ? 1 : 0;
    this.hf = f & FLAGS.HCARRY ? 1 : 0;
    this.pf = f & FLAGS.PARITY ? 1 : 0;
    this.cf = f & FLAGS.CARRY  ? 1 : 0;
  }

  @inline
  get bc(): u16 { return this.rp(Register.B); }
  @inline
  get de(): u16 { return this.rp(Register.D); }
  @inline
  get hl(): u16 { return this.rp(Register.H); }
    
  @inline
  get b(): RegisterValue { return this.reg(Register.B); }
  @inline
  get c(): RegisterValue { return this.reg(Register.C); }
  @inline
  get d(): RegisterValue { return this.reg(Register.D); }
  @inline
  get e(): RegisterValue { return this.reg(Register.E); }
  @inline
  get h(): RegisterValue { return this.reg(Register.H); }
  @inline
  get l(): RegisterValue { return this.reg(Register.L); }
  @inline
  get a(): RegisterValue { return this.reg(Register.A); }

  @inline
  set b(v: RegisterValue) { this.set_reg(Register.B, v); }
  @inline
  set c(v: RegisterValue) { this.set_reg(Register.C, v); }
  @inline
  set d(v: RegisterValue) { this.set_reg(Register.D, v); }
  @inline
  set e(v: RegisterValue) { this.set_reg(Register.E, v); }
  @inline
  set h(v: RegisterValue) { this.set_reg(Register.H, v); }
  @inline
  set l(v: RegisterValue) { this.set_reg(Register.L, v); }
  @inline
  set a(v: RegisterValue) { this.set_reg(Register.A, v); }

  @inline
  next_pc_byte(): u8 { return this.memory_read_byte(this.pc++); }

  @inline
  next_pc_word(): u16 {
    this.pc += 2;
    return this.memory_read_word(this.pc - 2);
  }
}
