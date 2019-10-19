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

import {I8080Base} from './i8080_base';

type RegisterIdx = u8;

export class I8080Ops extends I8080Base {
  inr(r: RegisterIdx): void {
    const v = <u8>this.reg(r) + 1;
    this.set_reg(r, v);
    this.sf = (v & 0x80) != 0;
    this.zf = (v == 0);
    this.hf = (v & 0x0f) == 0;
    this.pf = unchecked(this.parity_table[v]);
  }

  dcr(r: RegisterIdx): void {
    const v = <u8>this.reg(r) - 1;
    this.set_reg(r, v);
    this.sf = (v & 0x80) != 0;
    this.zf = (v == 0);
    this.hf = !((v & 0x0f) == 0x0f);
    this.pf = unchecked(this.parity_table[v]);
  }

  add_im8(v: u8, carry: u8): void {
    let a = this.a;
    const w16 = (<u16>a + <u16>v + (carry ? 1 : 0));
    const index = ((a & 0x88) >> 1) | ((v & 0x88) >> 2) | ((w16 & 0x88) >> 3);
    a = <u8>w16;
    this.sf = (a & 0x80) != 0;
    this.zf = (a == 0);
    this.hf = unchecked(this.half_carry_table[index & 0x7]);
    this.pf = unchecked(this.parity_table[a]);
    this.cf = (w16 & 0x0100) != 0;
    this.a = a;
  }

  @inline
  add(r: RegisterIdx, carry: u8): void {
    this.add_im8(<u8>this.reg(r), carry);
  }

  sub_im8(v: u8, carry: u8): void {
    let a = this.a;
    const w16 = <u16>(<u16>a - <u16>v - <u16>carry);
    const index = ((a & 0x88) >> 1) | ((v & 0x88) >> 2) | ((w16 & 0x88) >> 3);
    a = <u8>w16;
    this.sf = (a & 0x80) != 0;
    this.zf = (a == 0);
    this.hf = !unchecked(this.sub_half_carry_table[index & 0x7]);
    this.pf =  unchecked(this.parity_table[a]);
    this.cf = (w16 & 0x0100) != 0;
    this.a = a;
  }

  @inline
  sub(r: RegisterIdx, carry: u8): void {
    this.sub_im8(<u8>this.reg(r), carry);
  }

  cmp_im8(v: u8): void {
    const a = this.a;    // Store the accumulator before substraction.
    this.sub_im8(v, 0);
    this.a = a;       // Ignore the accumulator value after substraction.
  }

  @inline
  cmp(r: RegisterIdx): void {
    this.cmp_im8(<u8>this.reg(r));
  }

  ana_im8(v: u8): void {
    let a = this.a;
    this.hf = ((a | v) & 0x08) != 0;
    a &= v;
    this.sf = (a & 0x80) != 0;
    this.zf = (a == 0);
    this.pf = unchecked(this.parity_table[a]);
    this.cf = 0;
    this.a = a;
  }

  @inline
  ana(r: RegisterIdx): void {
    this.ana_im8(<u8>this.reg(r));
  }

  xra_im8(v: u8): void {
    let a = this.a;
    a ^= v;
    this.sf = (a & 0x80) != 0;
    this.zf = (a == 0);
    this.hf = 0;
    this.pf = unchecked(this.parity_table[a]);
    this.cf = 0;
    this.a = a;
  }

  @inline
  xra(r: RegisterIdx): void {
    this.xra_im8(<u8>this.reg(r));
  }

  ora_im8(v: u8): void {
    let a = this.a;
    a |= v;
    this.sf = (a & 0x80) != 0;
    this.zf = (a == 0);
    this.hf = 0;
    this.pf = unchecked(this.parity_table[a]);
    this.cf = 0;
    this.a = a;
  }

  @inline
  ora(r: RegisterIdx): void {
    this.ora_im8(<u8>this.reg(r));
  }

  // r - 0 (bc), 2 (de), 4 (hl), 6 (sp)
  @inline
  dad(r: RegisterIdx): void {
    const hl = <u32>this.hl + <u32>this.rp(r);
    this.cf = (hl & 0x10000) != 0;
    this.h = <u8>(hl >> 8);
    this.l = <u8>hl;
  }

  @inline
  call(w16: u16): void {
    this.push(this.pc);
    this.pc = w16;
  }

  ret(): void {
    this.pc = this.pop();
  }

  pop(): u16 {
    const v = this.memory_read_word(this.sp);
    this.sp += 2;
    return v;
  }

  push(v: u16): void {
    this.sp -= 2;
    this.memory_write_word(this.sp, v);
  }

  rst(addr: u16): void {
    this.push(this.pc);
    this.pc = addr;
  }
}
