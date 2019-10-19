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

import {I8080Ops} from './i8080_ops';

type RegisterIdx = u8;

export class I8080 extends I8080Ops {
  executeHi(opcode: u8): u8 { // opcode >= 0x80
    let cpu_cycles: u8;
    let r: RegisterIdx;
    let w16: u16;
    let direction: u8;
    if(opcode < 0xC0) {
      r = opcode & 0x07;
      cpu_cycles = (r != 6 ? 4 : 7);
      if(opcode < 0x90) { // add + adc
        // add, 0x80, 10000rrr
        // adc, 0x80, 10001rrr
        // rrr - b, c, d, e, h, l, m, a
        this.add(r, (opcode & 0x08 ? this.cf : 0));
      } else if(opcode < 0xA0) { // sub + sbb
        // sub, 0x90, 10010rrr
        // sbb, 0x98, 10010rrr
        // rrr - b, c, d, e, h, l, m, a
        this.sub(r, (opcode & 0x08 ? this.cf : 0));
      } else if(opcode < 0xA8) { // ana
        this.ana(r);
      } else if(opcode < 0xB0) { // xra
        this.xra(r);
      } else if(opcode < 0xB8) { // ora
        this.ora(r);
      } else if(opcode < 0xC0) { // cmp
        this.cmp(r);
      }
      return cpu_cycles;
    }
    switch (opcode) {
      // rnz, rz, rnc, rc, rpo, rpe, rp, rm
      // 0xC0, 11ccd000
      // cc - 00 (zf), 01 (cf), 10 (pf), 11 (sf)
      // d - 0 (negate) or 1.
      case 0xC0:            /* rnz */
      case 0xC8:            /* rz */
      case 0xD0:            /* rnc */
      case 0xD8:            /* rc */
      case 0xE0:            /* rpo */
      case 0xE8:            /* rpe */
      case 0xF0:            /* rp */
      case 0xF8: {          /* rm */
          let flag: boolean;
          r = (opcode >> 4) & 0x03;
          if(r == 0) { flag = this.zf > 0; }
          if(r == 1) { flag = this.cf > 0; }
          if(r == 2) { flag = this.pf > 0; }
          if(r == 3) { flag = this.sf > 0; }
          direction = (opcode & 0x08) != 0;
          cpu_cycles = 5;
          if (flag == direction) {
            cpu_cycles = 11;
            this.ret();
          }
          break;
        }

      // pop, 0xC1, 11rr0001
      // rr - 00 (bc), 01 (de), 10 (hl), 11 (psw)
      case 0xC1:            /* pop b */
      case 0xD1:            /* pop d */
      case 0xE1:            /* pop h */
      case 0xF1:            /* pop psw */
          r = (opcode & 0x30) >> 3;
          cpu_cycles = 11;
          w16 = this.pop();
          if (r != 6) {
            this.set_rp(r, w16);
          } else {
            this.a = <u8>(w16 >> 8);
            this.retrieve_flags(<u8>w16);
          }
          break;

      // jnz, jz, jnc, jc, jpo, jpe, jp, jm
      // 0xC2, 11ccd010
      // cc - 00 (zf), 01 (cf), 10 (pf), 11 (sf)
      // d - 0 (negate) or 1.
      case 0xC2:            /* jnz addr */
      case 0xCA:            /* jz addr */
      case 0xD2:            /* jnc addr */
      case 0xDA:            /* jc addr */
      case 0xE2:            /* jpo addr */
      case 0xEA:            /* jpe addr */
      case 0xF2:            /* jp addr */
      case 0xFA: {          /* jm addr */
          let flag: boolean;
          r = (opcode >> 4) & 0x03;
          if(r == 0) { flag = this.zf > 0; }
          if(r == 1) { flag = this.cf > 0; }
          if(r == 2) { flag = this.pf > 0; }
          if(r == 3) { flag = this.sf > 0; }
          
          direction = (opcode & 0x08) != 0;
          cpu_cycles = 10;
          w16 = this.next_pc_word();
          this.pc = flag == direction ? w16 : this.pc;
          break;
      }
      // jmp, 0xc3, 1100r011
      case 0xC3:            /* jmp addr */
      case 0xCB:            /* jmp addr, undocumented */
          cpu_cycles = 10;
          this.pc = this.next_pc_word();
          break;

      // cnz, cz, cnc, cc, cpo, cpe, cp, cm
      // 0xC4, 11ccd100
      // cc - 00 (zf), 01 (cf), 10 (pf), 11 (sf)
      // d - 0 (negate) or 1.
      case 0xC4:            /* cnz addr */
      case 0xCC:            /* cz addr */
      case 0xD4:            /* cnc addr */
      case 0xDC:            /* cc addr */
      case 0xE4:            /* cpo addr */
      case 0xEC:            /* cpe addr */
      case 0xF4:            /* cp addr */
      case 0xFC: {          /* cm addr */
          let flag: boolean;
          let r = (opcode >> 4) & 0x03;
          if(r == 0) { flag = this.zf > 0; }
          if(r == 1) { flag = this.cf > 0; }
          if(r == 2) { flag = this.pf > 0; }
          if(r == 3) { flag = this.sf > 0; }
          let direction = (opcode & 0x08) != 0;
          let w16 = this.next_pc_word();
          cpu_cycles = 11;
          if (flag == direction) {
            cpu_cycles = 17;
            this.call(w16);
          }
          break;
      }
      // push, 0xC5, 11rr0101
      // rr - 00 (bc), 01 (de), 10 (hl), 11 (psw)
      case 0xC5:            /* push b */
      case 0xD5:            /* push d */
      case 0xE5:            /* push h */
      case 0xF5: {          /* push psw */
          let r = (opcode & 0x30) >> 3;
          cpu_cycles = 11;
          let w16 = r != 6 ? this.rp(r) : (<u16>this.a << 8) | this.store_flags();
          this.push(w16);
          break;
      }

      case 0xC6:            /* adi data8 */
          cpu_cycles = 7;
          this.add_im8(this.next_pc_byte(), 0);
          break;

      // rst, 0xC7, 11aaa111
      // aaa - 000(0)-111(7), address = aaa*8 (0 to 0x38).
      case 0xC7:            /* rst 0 */
      case 0xCF:            /* rst 1 */
      case 0xD7:            /* rst 2 */
      case 0xDF:            /* rst 3 */
      case 0xE7:            /* rst 4 */
      case 0xEF:            /* rst 5 */
      case 0xF7:            /* rst 5 */
      case 0xFF:            /* rst 7 */
          cpu_cycles = 11;
          this.rst(opcode & 0x38);
          break;

      // ret, 0xc9, 110r1001
      case 0xC9:            /* ret */
      case 0xD9:            /* ret, undocumented */
          cpu_cycles = 10;
          this.ret();
          break;

      // call, 0xcd, 11rr1101
      case 0xCD:            /* call addr */
      case 0xDD:            /* call, undocumented */
      case 0xED:
      case 0xFD:
          cpu_cycles = 17;
          this.call(this.next_pc_word());
          break;

      case 0xCE:            /* aci data8 */
          cpu_cycles = 7;
          this.add_im8(this.next_pc_byte(), this.cf);
          break;

      case 0xD3:            /* out port8 */
          cpu_cycles = 10;
          this.io.output(this.next_pc_byte(), <u8>this.a);
          break;

      case 0xD6:            /* sui data8 */
          cpu_cycles = 7;
          this.sub_im8(this.next_pc_byte(), 0);
          break;

      case 0xDB:            /* in port8 */
          cpu_cycles = 10;
          this.a = (this.io.input(this.next_pc_byte()));
          break;

      case 0xDE:            /* sbi data8 */
          cpu_cycles = 7;
          this.sub_im8(this.next_pc_byte(), this.cf);
          break;

      case 0xE3:            /* xthl */
          cpu_cycles = 18;
          w16 = this.memory_read_word(this.sp);
          this.memory_write_word(this.sp, this.hl);
          this.l = <u8>w16;
          this.h = <u8>(w16 >> 8);
          break;

      case 0xE6:            /* ani data8 */
          cpu_cycles = 7;
          this.ana_im8(this.next_pc_byte());
          break;

      case 0xE9:            /* pchl */
          cpu_cycles = 5;
          this.pc = this.hl;
          break;

      case 0xEB: {            /* xchg */
          cpu_cycles = 4;
          let w8 = this.l;
          this.l = this.e;
          this.e = w8;
          w8 = this.h;
          this.h = this.d;
          this.d = w8;
          break;
      }

      case 0xEE:            /* xri data8 */
          cpu_cycles = 7;
          this.xra_im8(this.next_pc_byte());
          break;

      // di/ei, 1111c011
      // c - 0 (di), 1 (ei)
      case 0xF3:            /* di */
      case 0xFB:            /* ei */
          cpu_cycles = 4;
          this.iff = (opcode & 0x08) != 0;
          this.io.interrupt(this.iff);
          break;

      case 0xF6:            /* ori data8 */
          cpu_cycles = 7;
          this.ora_im8(this.next_pc_byte());
          break;

      case 0xF9:            /* sphl */
          cpu_cycles = 5;
          this.sp = this.hl;
          break;

      case 0xFE:            /* cpi data8 */
          cpu_cycles = 7;
          this.cmp_im8(this.next_pc_byte());
          break;
    }
    return cpu_cycles;
  }

  executeLo(opcode: u8): u8 { // opcode < 0x80
    let cpu_cycles: u8;
    let w8: u8;
    let w16: u16;
    if(opcode >= 0x40) {
      if(opcode == 0x76) { /* hlt */
        cpu_cycles = 4;
        this.pc--;
      } else {
          // mov, 0x40, 01dddsss
          // ddd, sss - b, c, d, e, h, l, m, a
          //            0  1  2  3  4  5  6  7
          let src = opcode & 7;
          let dst = (opcode >> 3) & 7;
          cpu_cycles = (src == 6 || dst == 6 ? 7 : 5);
          this.set_reg(dst, <u8>this.reg(src));
      }
      return cpu_cycles;
    }
    switch (opcode) {
      // nop, 0x00, 00rrr000
      // r - 000(0) to 111(7)
      case 0x00:            /* nop */
      // Undocumented NOP.
      case 0x08:            /* nop */
      case 0x10:            /* nop */
      case 0x18:            /* nop */
      case 0x20:            /* nop */
      case 0x28:            /* nop */
      case 0x30:            /* nop */
      case 0x38:            /* nop */
          cpu_cycles = 4;
          break;

      // lxi, 0x01, 00rr0001
      // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
      case 0x01:            /* lxi b, data16 */
      case 0x11:            /* lxi d, data16 */
      case 0x21:            /* lxi h, data16 */
      case 0x31:            /* lxi sp, data16 */
          cpu_cycles = 10;
          this.set_rp(opcode >> 3, this.next_pc_word());
          break;

      // stax, 0x02, 000r0010
      // r - 0 (bc), 1 (de)
      case 0x02:            /* stax b */
      case 0x12:            /* stax d */
          cpu_cycles = 7;
          this.memory_write_byte(this.rp(opcode >> 3), <u8>this.a);
          break;

      // inx, 0x03, 00rr0011
      // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
      case 0x03:            /* inx b */
      case 0x13:            /* inx d */
      case 0x23:            /* inx h */
      case 0x33: {          /* inx sp */
          cpu_cycles = 5;
          const r = opcode >> 3;
          this.set_rp(r, this.rp(r) + 1);
          break;
      }

      // inr, 0x04, 00rrr100
      // rrr - b, c, d, e, h, l, m, a
      case 0x04:            /* inr b */
      case 0x0C:            /* inr c */
      case 0x14:            /* inr d */
      case 0x1C:            /* inr e */
      case 0x24:            /* inr h */
      case 0x2C:            /* inr l */
      case 0x34:            /* inr m */
      case 0x3C:            /* inr a */
          cpu_cycles = opcode != 0x34 ? 5 : 10;
          this.inr(opcode >> 3);
          break;

      // dcr, 0x05, 00rrr100
      // rrr - b, c, d, e, h, l, m, a
      case 0x05:            /* dcr b */
      case 0x0D:            /* dcr c */
      case 0x15:            /* dcr d */
      case 0x1D:            /* dcr e */
      case 0x25:            /* dcr h */
      case 0x2D:            /* dcr l */
      case 0x35:            /* dcr m */
      case 0x3D:            /* dcr a */
          cpu_cycles = opcode != 0x35 ? 5 : 10;
          this.dcr(opcode >> 3);
          break;

      // mvi, 0x06, 00rrr110
      // rrr - b, c, d, e, h, l, m, a
      case 0x06:            /* mvi b, data8 */
      case 0x0E:            /* mvi c, data8 */
      case 0x16:            /* mvi d, data8 */
      case 0x1E:            /* mvi e, data8 */
      case 0x26:            /* mvi h, data8 */
      case 0x2E:            /* mvi l, data8 */
      case 0x36:            /* mvi m, data8 */
      case 0x3E:            /* mvi a, data8 */
          cpu_cycles = opcode != 0x36 ? 7 : 10;
          this.set_reg(opcode >> 3, this.next_pc_byte());
          break;

      case 0x07: {          /* rlc */
          cpu_cycles = 4;
          const a = this.a;
          this.cf = ((a & 0x80) != 0);
          this.a = <u8>(((<u16>a << 1) & 0xff) | (this.cf ? 1 : 0));
          break;
      }

      // dad, 0x09, 00rr1001
      // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
      case 0x09:            /* dad b */
      case 0x19:            /* dad d */
      case 0x29:            /* dad hl */
      case 0x39:            /* dad sp */
          cpu_cycles = 10;
          this.dad((opcode & 0x30) >> 3);
          break;

      // ldax, 0x0A, 000r1010
      // r - 0 (bc), 1 (de)
      case 0x0A:            /* ldax b */
      case 0x1A: {          /* ldax d */
          cpu_cycles = 7;
          const r = (opcode & 0x10) >> 3;
          this.a = (this.memory_read_byte(this.rp(r)));
          break;
      }

      // dcx, 0x0B, 00rr1011
      // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
      case 0x0B:            /* dcx b */
      case 0x1B:            /* dcx d */
      case 0x2B:            /* dcx h */
      case 0x3B: {          /* dcx sp */
          cpu_cycles = 5;
          const r = (opcode & 0x30) >> 3;
          this.set_rp(r, (this.rp(r) - 1));
          break;
      }

      case 0x0F:            /* rrc */
          cpu_cycles = 4;
          this.cf = <bool>(this.a & 0x01);
          this.a = <u8>((this.a >> 1) | (<u16>this.cf << 7));
          break;

      case 0x17:            /* ral */
          cpu_cycles = 4;
          w8 = this.cf;
          this.cf = ((this.a & 0x80) != 0);
          this.a = <u8>((<u16>this.a << 1) | w8);
          break;

      case 0x1F:             /* rar */
          cpu_cycles = 4;
          w8 = this.cf;
          this.cf = <bool>(this.a & 0x01);
          this.a = <u8>((this.a >> 1) | (<u16>w8 << 7));
          break;

      case 0x22:            /* shld addr */
          cpu_cycles = 16;
          w16 = this.next_pc_word();
          this.memory_write_byte(w16, <u8>this.l);
          this.memory_write_byte(w16 + 1, <u8>this.h);
          break;

      case 0x27: {          /* daa */
          cpu_cycles = 4;
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
          break;
      }

      case 0x2A: {           /* ldhl addr */
          cpu_cycles = 16;
          const w16 = this.next_pc_word();
          unchecked(this.regs[5] = this.memory_read_byte(w16));
          unchecked(this.regs[4] = this.memory_read_byte(w16 + 1));
          break;
      }

      case 0x2F:            /* cma */
          cpu_cycles = 4;
          this.a = (this.a ^ 0xff);
          break;

      case 0x32:            /* sta addr */
          cpu_cycles = 13;
          this.memory_write_byte(this.next_pc_word(), <u8>this.a);
          break;

      case 0x37:            /* stc */
          cpu_cycles = 4;
          this.cf = 1;
          break;

      case 0x3A:            /* lda addr */
          cpu_cycles = 13;
          this.a = (this.memory_read_byte(this.next_pc_word()));
          break;

      case 0x3F:            /* cmc */
          cpu_cycles = 4;
          this.cf = !this.cf;
          break;
    }
    return cpu_cycles;
  }

  execute(opcode: u8): u8 {
    if(opcode >= 0x80) {return this.executeHi(opcode); }
    return this.executeLo(opcode);
  }

  @inline
  instruction(): u8 {
    return this.execute(this.next_pc_byte());
  }

  @inline
  jump(addr: u16): void {
    this.pc = addr;
  }
}
