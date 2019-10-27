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

import {Register} from './constants';
import {I8080Ops} from './i8080_ops';

export class I8080OpsExtended extends I8080Ops {
  @inline push_b(): void   { this.push(Register.B); }
  @inline push_d(): void   { this.push(Register.D); }
  @inline push_h(): void   { this.push(Register.H); }
  @inline push_psw(): void { this.push(Register.M); }

  @inline pop_b(): void   { this.pop(Register.B); }
  @inline pop_d(): void   { this.pop(Register.D); }
  @inline pop_h(): void   { this.pop(Register.H); }
  @inline pop_psw(): void { this.pop(Register.M); }

  @inline dad_b(): void  { this.dad(Register.B); }
  @inline dad_d(): void  { this.dad(Register.D); }
  @inline dad_hl(): void { this.dad(Register.H); }
  @inline dad_sp(): void { this.dad(Register.M); }

  @inline dcx_b(): void  { this.dcx(Register.B); }
  @inline dcx_d(): void  { this.dcx(Register.D); }
  @inline dcx_hl(): void { this.dcx(Register.H); }
  @inline dcx_sp(): void { this.dcx(Register.M); }

  @inline lxi_b(): void  { this.lxi(Register.B); }
  @inline lxi_d(): void  { this.lxi(Register.D); }
  @inline lxi_hl(): void { this.lxi(Register.H); }
  @inline lxi_sp(): void { this.lxi(Register.M); }

  @inline inr_b(): void { this.inr(Register.B); }
  @inline inr_c(): void { this.inr(Register.C); }
  @inline inr_d(): void { this.inr(Register.D); }
  @inline inr_e(): void { this.inr(Register.E); }
  @inline inr_h(): void { this.inr(Register.H); }
  @inline inr_l(): void { this.inr(Register.L); }
  @inline inr_m(): void { this.inr(Register.M); }
  @inline inr_a(): void { this.inr(Register.A); }

  @inline dcr_b(): void { this.dcr(Register.B); }
  @inline dcr_c(): void { this.dcr(Register.C); }
  @inline dcr_d(): void { this.dcr(Register.D); }
  @inline dcr_e(): void { this.dcr(Register.E); }
  @inline dcr_h(): void { this.dcr(Register.H); }
  @inline dcr_l(): void { this.dcr(Register.L); }
  @inline dcr_m(): void { this.dcr(Register.M); }
  @inline dcr_a(): void { this.dcr(Register.A); }

  @inline mvi_b(): void { this.mvi(Register.B); }
  @inline mvi_c(): void { this.mvi(Register.C); }
  @inline mvi_d(): void { this.mvi(Register.D); }
  @inline mvi_e(): void { this.mvi(Register.E); }
  @inline mvi_h(): void { this.mvi(Register.H); }
  @inline mvi_l(): void { this.mvi(Register.L); }
  @inline mvi_m(): void { this.mvi(Register.M); }
  @inline mvi_a(): void { this.mvi(Register.A); }

  @inline inx_b(): void  { this.inx(Register.B); }
  @inline inx_d(): void  { this.inx(Register.D); }
  @inline inx_hl(): void { this.inx(Register.H); }
  @inline inx_sp(): void { this.inx(Register.M); }

  @inline ldax_b(): void { this.ldax(Register.B); }
  @inline ldax_d(): void { this.ldax(Register.D); }

  @inline stax_b(): void { this.stax(Register.B); }
  @inline stax_d(): void { this.stax(Register.D); }
}

