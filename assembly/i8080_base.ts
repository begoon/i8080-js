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

@inline
const F_CARRY : u8 = 0x01;
@inline
const F_UN1   : u8 = 0x02;
@inline
const F_PARITY: u8 = 0x04;
@inline
const F_UN3   : u8 = 0x08;
@inline
const F_HCARRY: u8 = 0x10;
@inline
const F_UN5   : u8 = 0x20;
@inline
const F_ZERO  : u8 = 0x40;
@inline
const F_NEG   : u8 = 0x80;

type RegisterIdx = u8;
type RegisterValue = i32;

export class I8080Base {
  public pc: u16 = 0;
  public sp: u16 = 0;
  public iff: bool= 0;

  public sf: bool = 0;
  public pf: bool = 0;
  public hf: bool = 0;
  public zf: bool = 0;
  public cf: bool = 0;

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

  public memory: Uint8Array;
  public io: IO;

  constructor(memory: Memory, io: IO) {
    // this.regs = new Uint8Array(8);
    this.memory = memory.mem;
    this.io = io;
  }

  @inline
  memory_read_byte(addr: u16): u8 {
    return unchecked(this.memory[addr]);
  }

  @inline
  memory_write_byte(addr: u16, w8: u8): void {
    unchecked(this.memory[addr] = w8);
  }

  @inline
  memory_read_word(addr: u16): u16 {
    return this.memory_read_byte(addr) | (<u16>this.memory_read_byte(addr + 1) << 8); 
  }

  @inline
  memory_write_word(addr: u16, w16: u16): void {
    this.memory_write_byte(addr, <u8>w16);
    this.memory_write_byte(addr + 1, <u8>(w16 >> 8));
  }

  @inline
  reg(r: RegisterIdx): RegisterValue {
    return r != 6 ? unchecked(this.regs[r]) : this.memory_read_byte(this.hl);
  }

  @inline
  set_reg(r: RegisterIdx, w8: RegisterValue): void {
    w8 &= 0xff;
    if (r != 6)
      unchecked(this.regs[r] = w8);
    else
      this.memory_write_byte(this.hl, <u8>w8);
  }

  // r - 00 (bc), 01 (de), 10 (hl), 11 (sp)
  @inline
  rp(r: RegisterIdx): u16 {
    return r != 6 ? ((<u16>unchecked(this.regs[r]) << 8) | <u16>unchecked(this.regs[r + 1])) : this.sp;
  }

  // @inline
  set_rp(r: RegisterIdx, w16: u16): void {
    if (r != 6) {
      this.set_reg(r, <u8>(w16 >> 8));
      this.set_reg(r + 1, <u8>w16);
    } else
      this.sp = w16;
  }

  store_flags(): u8 {
    var f = <u8>0;
    if (this.sf) f |= F_NEG;    else f &= ~F_NEG;
    if (this.zf) f |= F_ZERO;   else f &= ~F_ZERO;
    if (this.hf) f |= F_HCARRY; else f &= ~F_HCARRY;
    if (this.pf) f |= F_PARITY; else f &= ~F_PARITY;
    if (this.cf) f |= F_CARRY;  else f &= ~F_CARRY;
    f |= F_UN1;    // UN1_FLAG is always 1.
    f &= ~F_UN3;   // UN3_FLAG is always 0.
    f &= ~F_UN5;   // UN5_FLAG is always 0.
    return f;
  }

  retrieve_flags(f: u8): void {
    this.sf = f & F_NEG    ? 1 : 0;
    this.zf = f & F_ZERO   ? 1 : 0;
    this.hf = f & F_HCARRY ? 1 : 0;
    this.pf = f & F_PARITY ? 1 : 0;
    this.cf = f & F_CARRY  ? 1 : 0;
  }

  @inline
  get bc(): u16 { return this.rp(0); }
  @inline
  get de(): u16 { return this.rp(2); }
  @inline
  get hl(): u16 { return this.rp(4); }
    
  @inline
  get b(): RegisterValue { return unchecked(this.regs[0]); }
  @inline
  get c(): RegisterValue { return unchecked(this.regs[1]); }
  @inline
  get d(): RegisterValue { return unchecked(this.regs[2]); }
  @inline
  get e(): RegisterValue { return unchecked(this.regs[3]); }
  @inline
  get h(): RegisterValue { return unchecked(this.regs[4]); }
  @inline
  get l(): RegisterValue { return unchecked(this.regs[5]); }
  @inline
  get a(): RegisterValue { return unchecked(this.regs[7]); }

  @inline
  set b(v: RegisterValue) { unchecked(this.regs[0] = v); }
  @inline
  set c(v: RegisterValue) { unchecked(this.regs[1] = v); }
  @inline
  set d(v: RegisterValue) { unchecked(this.regs[2] = v); }
  @inline
  set e(v: RegisterValue) { unchecked(this.regs[3] = v); }
  @inline
  set h(v: RegisterValue) { unchecked(this.regs[4] = v); }
  @inline
  set l(v: RegisterValue) { unchecked(this.regs[5] = v); }
  @inline
  set a(v: RegisterValue) { unchecked(this.regs[7] = v); }

  @inline
  next_pc_byte(): u8 {
    return this.memory_read_byte(this.pc++);
  }

  // @inline
  next_pc_word(): u16 {
    return this.next_pc_byte() | (<u16>this.next_pc_byte() << 8);
  }
}
