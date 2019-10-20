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
    cycles: u8[] = [
        4, 10, 7,  5,  5,  5,  7,  4,  4, 10, 7,  5,  5,  5,  7, 4,
        4, 10, 7,  5,  5,  5,  7,  4,  4, 10, 7,  5,  5,  5,  7, 4,
        4, 10, 16, 5,  5,  5,  7,  4,  4, 10, 16, 5,  5,  5,  7, 4,
        4, 10, 13, 5,  5,  5,  10, 4,  4, 10, 13, 5,  5,  5,  7, 4,
        5, 5,  5,  5,  5,  5,  7,  5,  5, 5,  5,  5,  5,  5,  7, 5,
        5, 5,  5,  5,  5,  5,  7,  5,  5, 5,  5,  5,  5,  5,  7, 5,
        5, 5,  5,  5,  5,  5,  7,  5,  5, 5,  5,  5,  5,  5,  7, 5,
        7, 7,  7,  7,  7,  7,  7,  7,  5, 5,  5,  5,  5,  5,  7, 5,
        4, 4,  4,  4,  4,  4,  7,  4,  4, 4,  4,  4,  4,  4,  7, 4,
        4, 4,  4,  4,  4,  4,  7,  4,  4, 4,  4,  4,  4,  4,  7, 4,
        4, 4,  4,  4,  4,  4,  7,  4,  4, 4,  4,  4,  4,  4,  7, 4,
        4, 4,  4,  4,  4,  4,  7,  4,  4, 4,  4,  4,  4,  4,  7, 4,
        5, 10, 10, 10, 11, 11, 7,  11, 5, 10, 10, 10, 11, 17, 7, 11,
        5, 10, 10, 10, 11, 11, 7,  11, 5, 10, 10, 10, 11, 17, 7, 11,
        5, 10, 10, 18, 11, 11, 7,  11, 5, 5,  10, 5,  11, 17, 7, 11,
        5, 10, 10, 4,  11, 11, 7,  11, 5, 5,  10, 4,  11, 17, 7, 11,
    ]

  // ! @inline
  executeHi(opcode: u8): u8 { // opcode >= 0x80
    let cpu_cycles: u8 = unchecked(this.cycles[opcode]);
    let r: RegisterIdx;
    let w16: u16;
    let direction: u8;
    // rrr - b, c, d, e, h, l, m, a
    if(opcode < 0xC0) {
        r = opcode & 0x07;
        switch(opcode & 0xf8) {
            case 0x80: this.add(r,       0); break; // add, 0x80, 10000rrr
            case 0x88: this.add(r, this.cf); break; // adc, 0x88, 10001rrr
            case 0x90: this.sub(r,       0); break; // sub, 0x90, 10010rrr
            case 0x98: this.sub(r, this.cf); break; // sbb, 0x98, 10010rrr

            case 0xA0: this.ana(r); break;
            case 0xA8: this.xra(r); break;
            case 0xB0: this.ora(r); break;
            case 0xB8: this.cmp(r); break;
        }
    } else {
        switch (opcode) { // >= 0xC0
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
          case 0xF1: this.pop((opcode & 0x30) >> 3); break; /* pop psw */
    
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
              w16 = this.next_pc_word();
              this.pc = flag == direction ? w16 : this.pc;
              break;
          }
          
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
              if (flag == direction) {
                  cpu_cycles = 17;
                this.call(w16);
            }
              break;
          }
          // push, 0xC5, 11rr0101
          // rr - 00 (bc), 01 (de), 10 (hl), 11 (psw)
          case 0xC5:                                         /* push b */
          case 0xD5:                                         /* push d */
          case 0xE5:                                         /* push h */
          case 0xF5: this.push((opcode & 0x30) >> 3); break; /* push psw */
    
          
          // rst, 0xC7, 11aaa111
          // aaa - 000(0)-111(7), address = aaa*8 (0 to 0x38).
          case 0xC7:                                 /* rst 0 */
          case 0xCF:                                 /* rst 1 */
          case 0xD7:                                 /* rst 2 */
          case 0xDF:                                 /* rst 3 */
          case 0xE7:                                 /* rst 4 */
          case 0xEF:                                 /* rst 5 */
          case 0xF7:                                 /* rst 5 */
          case 0xFF: this.rst(opcode & 0x38); break; /* rst 7 */
          
          // ret, 0xc9, 110r1001
          case 0xC9:                    /* ret */
          case 0xD9: this.ret(); break; /* ret */
          
          // call, 0xcd, 11rr1101
          case 0xCD:            /* call addr */
          case 0xDD:            /* call, undocumented */
          case 0xED:
          case 0xFD: this.call(this.next_pc_word()); break;
              
          case 0xC3: this.jmp(); break; /* jmp addr */
          case 0xD3: this.io_out(); break; /* out port8 */
          case 0xE3: this.xthl(); break; /* xthl */
          case 0xF3: this.di(); break; /* di */
          
          case 0xC6: this.adi(); break; /* adi data8 */
          case 0xD6: this.sui(); break; /* sui data8 */
          case 0xE6: this.ani(); break; /* ani data8 */
          case 0xF6: this.ori(); break; /* ori data8 */
          
          case 0xE9: this.pchl(); break; /* pchl */
          case 0xF9: this.sphl(); break; /* sphl */
          
          case 0xCB: this.jmp(); break; /* jmp addr, undocumented */
          case 0xDB: this.io_in(); break; /* in port8 */
          case 0xEB: this.xchg(); break; /* xchg */
          case 0xFB: this.ei(); break; /* ei */

          case 0xCE: this.aci(); break; /* aci data8 */
          case 0xDE: this.sbi(); break; /* sbi data8 */
          case 0xEE: this.xri(); break; /* xri data8 */  
          case 0xFE: this.cpi(); break; /* cpi data8 */
        }
    }
    return cpu_cycles;
  }

  // ! @inline
  executeLo(opcode: u8): u8 { // opcode < 0x80
    if(opcode >= 0x40) {
      if(opcode == 0x76) { /* hlt */
        this.hlt();
      } else {
          // mov, 0x40, 01dddsss
          // ddd, sss - b, c, d, e, h, l, m, a
          //            0  1  2  3  4  5  6  7
          this.mov(opcode & 0x07, (opcode >> 3) & 0x07);
      }
    } else {
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
          case 0x38: this.nop(); break; /* nop */

          // lxi, 0x01, 00rr0001
          // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
          case 0x01:            /* lxi b, data16 */
          case 0x11:            /* lxi d, data16 */
          case 0x21:            /* lxi h, data16 */
          case 0x31: this.lxi(opcode >> 3); break; /* lxi sp, data16 */

          // stax, 0x02, 000r0010
          // r - 0 (bc), 1 (de)
          case 0x02:            /* stax b */
          case 0x12: this.stax(opcode >> 3); break; /* stax d */

          // inx, 0x03, 00rr0011
          // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
          case 0x03:            /* inx b */
          case 0x13:            /* inx d */
          case 0x23:            /* inx h */
          case 0x33: this.inx(opcode >> 3); break; /* inx sp */

          // inr, 0x04, 00rrr100
          // rrr - b, c, d, e, h, l, m, a
          case 0x04:            /* inr b */
          case 0x0C:            /* inr c */
          case 0x14:            /* inr d */
          case 0x1C:            /* inr e */
          case 0x24:            /* inr h */
          case 0x2C:            /* inr l */
          case 0x34:            /* inr m */
          case 0x3C: this.inr(opcode >> 3); break; /* inr a */

          // dcr, 0x05, 00rrr100
          // rrr - b, c, d, e, h, l, m, a
          case 0x05:            /* dcr b */
          case 0x0D:            /* dcr c */
          case 0x15:            /* dcr d */
          case 0x1D:            /* dcr e */
          case 0x25:            /* dcr h */
          case 0x2D:            /* dcr l */
          case 0x35:            /* dcr m */
          case 0x3D: this.dcr(opcode >> 3); break; /* dcr a */

          // mvi, 0x06, 00rrr110
          // rrr - b, c, d, e, h, l, m, a
          case 0x06:            /* mvi b, data8 */
          case 0x0E:            /* mvi c, data8 */
          case 0x16:            /* mvi d, data8 */
          case 0x1E:            /* mvi e, data8 */
          case 0x26:            /* mvi h, data8 */
          case 0x2E:            /* mvi l, data8 */
          case 0x36:            /* mvi m, data8 */
          case 0x3E: this.mvi(opcode >> 3); break; /* mvi a, data8 */

          case 0x07: this.rlc(); break; /* rlc */
              
          // dad, 0x09, 00rr1001
          // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
          case 0x09:            /* dad b */
          case 0x19:            /* dad d */
          case 0x29:            /* dad hl */
          case 0x39: this.dad((opcode & 0x30) >> 3); break; /* dad sp */

          // ldax, 0x0A, 000r1010
          // r - 0 (bc), 1 (de)
          case 0x0A:            /* ldax b */
          case 0x1A: this.ldax((opcode & 0x10) >> 3); break; /* ldax d */

          // dcx, 0x0B, 00rr1011
          // rr - 00 (bc), 01 (de), 10 (hl), 11 (sp)
          case 0x0B:            /* dcx b */
          case 0x1B:            /* dcx d */
          case 0x2B:            /* dcx h */
          case 0x3B: this.dcx((opcode & 0x30) >> 3); break; /* dcx sp */

          case 0x0F: this.rrc(); break; /* rrc */
          case 0x17: this.ral(); break; /* ral */
          case 0x1F: this.rar(); break; /* rar */
          case 0x22: this.shld(); break; /* shld addr */
          case 0x27: this.daa(); break; /* daa */
          case 0x2A: this.ldhl(); break; /* ldhl addr */
          case 0x2F: this.cma(); break; /* cma */
          case 0x32: this.sta(); break; /* sta addr */
          case 0x37: this.stc(); break; /* stc */
          case 0x3A: this.lda(); break; /* lda addr */
          case 0x3F: this.cmc(); break; /* cmc */
        }
    }
    return unchecked(this.cycles[opcode]);
  }

  execute(opcode: u8): u8 {
    if(opcode >= 0x80) {return this.executeHi(opcode); }
    return this.executeLo(opcode);
  }

  @inline
  instruction(): u8 { return this.execute(this.next_pc_byte()); }

  @inline
  jump(addr: u16): void { this.pc = addr; }
}
