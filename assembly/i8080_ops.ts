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
type RegisterPairIdx = u8;

export class I8080Ops extends I8080Base {
  @inline
  inr(r: RegisterIdx): void {
    const v = <u8>this.reg(r) + 1;
    this.set_reg(r, v);
    this.sf = (v & 0x80) != 0;
    this.zf = (v == 0);
    this.hf = (v & 0x0f) == 0;
    this.pf = unchecked(this.parity_table[v]);
  }

  @inline
  dcr(r: RegisterIdx): void {
    const v = <u8>this.reg(r) - 1;
    this.set_reg(r, v);
    this.sf = (v & 0x80) != 0;
    this.zf = (v == 0);
    this.hf = !((v & 0x0f) == 0x0f);
    this.pf = unchecked(this.parity_table[v]);
  }

  @inline
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

  @inline
  adc(r: RegisterIdx): void {
    this.add_im8(<u8>this.reg(r), this.cf);
  }

  @inline
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

  @inline
  private cmp_im8(v: u8): void {
    const a = this.a;    // Store the accumulator before substraction.
    this.sub_im8(v, 0);
    this.a = a;       // Ignore the accumulator value after substraction.
  }

  @inline
  cmp(r: RegisterIdx): void {
    this.cmp_im8(<u8>this.reg(r));
  }

  @inline
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

  @inline
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

  @inline
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
    this._push(this.pc);
    this.pc = w16;
  }

  @inline
  ret(): void {
    this.pc = this._pop();
  }

  @inline
  _pop(): u16 {
    const v = this.memory_read_word(this.sp);
    this.sp += 2;
    return v;
  }

  @inline
  _push(v: u16): void {
    this.sp -= 2;
    this.memory_write_word(this.sp, v);
  }

  @inline
  rst(addr: u16): void {
    this._push(this.pc);
    this.pc = addr;
  }

  @inline
  xchg() : void {
    const x = this.l;
    this.l = this.e;
    this.e = x;
    const y = this.h;
    this.h = this.d;
    this.d = y;
  }

  @inline
  mov(src: RegisterIdx, dst: RegisterIdx): void {
    this.set_reg(dst, this.reg(src));
  }

  @inline
  mvi(r: RegisterIdx): void {
    this.set_reg(r, this.next_pc_byte());
  }

  @inline
  inx(r: RegisterIdx): void {
    this.set_rp(r, this.rp(r) + 1);
  }

  @inline
  xthl(): void {
    const w16 = this.memory_read_word(this.sp);
    this.memory_write_word(this.sp, this.hl);
    this.l = <u8>w16;
    this.h = <u8>(w16 >> 8);
  }

  @inline
  pchl(): void {
    this.pc = this.hl;
  }

  @inline
  sphl(): void {
    this.sp = this.hl;
  }

  @inline
  nop(): void {}

  @inline
  stax(rp: RegisterPairIdx): void {
    this.memory_write_byte(this.rp(rp), <u8>this.a);
  }

  @inline
  adi(): void {
    this.add_im8(this.next_pc_byte(), 0);
  }

  @inline
  aci(): void {
    this.add_im8(this.next_pc_byte(), this.cf);
  }

  @inline
  ani(): void {
    this.ana_im8(this.next_pc_byte());
  }

  @inline
  xri(): void {
    this.xra_im8(this.next_pc_byte());
  }

  @inline
  ori(): void {
    this.ora_im8(this.next_pc_byte());
  }

  @inline
  cpi(): void {
    this.cmp_im8(this.next_pc_byte());
  }

  @inline
  sui(): void {
    this.sub_im8(this.next_pc_byte(), 0);
  }

  @inline
  sbi(): void {
    this.sub_im8(this.next_pc_byte(), this.cf);
  }

  @inline
  lxi(rp: RegisterPairIdx): void {
    this.set_rp(rp, this.next_pc_word());
  }

  @inline
  rlc(): void {
    // const a = this.a;
    this.cf = ((this.a & 0x80) != 0);
    this.a = <u8>(((<u16>this.a << 1) & 0xff) | (this.cf ? 1 : 0));
  }

  @inline
  ldax(rp: RegisterPairIdx): void {
    this.a = (this.memory_read_byte(this.rp(rp)));
  }

  @inline
  dcx(rp: RegisterPairIdx): void {
    this.set_rp(rp, (this.rp(rp) - 1));
  }

  @inline
  rrc(): void {
    this.cf = <bool>(this.a & 0x01);
    this.a = <u8>((this.a >> 1) | (<u16>this.cf << 7));
  }
  
  @inline
  ral(): void {
    const w8 = this.cf;
    this.cf = ((this.a & 0x80) != 0);
    this.a = <u8>((<u16>this.a << 1) | w8);
  }
  
  @inline
  rar(): void {
    const w8 = this.cf;
    this.cf = <bool>(this.a & 0x01);
    this.a = <u8>((this.a >> 1) | (<u16>w8 << 7));
  }
  
  @inline
  shld(): void {
    const w16 = this.next_pc_word();
    this.memory_write_byte(w16, <u8>this.l);
    this.memory_write_byte(w16 + 1, <u8>this.h);
  }

  @inline
  daa(): void {
    let carry = this.cf;
    let add = <u8>0;
    const a = this.a;
    if (this.hf || (a & 0x0f) > 9) add = 0x06;
    if (this.cf || (a >> 4) > 9 || ((a >> 4) >= 9 && (a & 0xf) > 9)) {
        add |= 0x60;
        carry = 1;
    }
    this.add_im8(add, 0);
    this.pf = unchecked(this.parity_table[this.a]);
    this.cf = carry;
  }

  @inline
  cma(): void {
    this.a = (this.a ^ 0xff);
  }

  @inline
  ldhl(): void {
    const w16 = this.next_pc_word();
    unchecked(this.regs[5] = this.memory_read_byte(w16));
    unchecked(this.regs[4] = this.memory_read_byte(w16 + 1));
  }

  @inline
  sta(): void {
    this.memory_write_byte(this.next_pc_word(), <u8>this.a);
  }

  @inline
  stc(): void {
    this.cf = 1;
  }

  @inline
  lda(): void {
    this.a = (this.memory_read_byte(this.next_pc_word()));
  }

  @inline
  cmc(): void {
    this.cf = !this.cf;
  }

  @inline
  hlt(): void {
    this.pc--;
  }

  @inline 
  ei(): void {
    this.iff = true;
    this.io.interrupt(true);
  }

  @inline 
  di(): void {
    this.iff = false;
    this.io.interrupt(false);
  }

  @inline
  io_in(): void {
    this.a = (this.io.input(this.next_pc_byte()));
  }

  @inline
  io_out(): void {
    this.io.output(this.next_pc_byte(), <u8>this.a);
  }

  @inline
  jmp(): void {
    this.pc = this.next_pc_word();
  }

  @inline
  push(rp: RegisterPairIdx): void {
    let w16 = rp != 6 ? this.rp(rp) : (<u16>this.a << 8) | this.store_flags();
    this._push(w16);
  }

  @inline
  pop(rp: RegisterPairIdx): void {
    let w16 = this._pop();
    if (rp != 6) {
      this.set_rp(rp, w16);
    } else {
      this.a = <u8>(w16 >> 8);
      this.retrieve_flags(<u8>w16);
    }
  }
}

