// Part of Intel 8080/KR580VM80A in JavaScript
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

import {console} from './console';
import {getData} from './files';
import {I8080} from './i8080';
import {hex16} from './utils';
import {IO} from './io';

import {I8080_trace} from './i8080_trace';

const cpu = new I8080(new IO());

let success_check: bool;
let success = false;

const StepState_incomplete = 0;
const StepState_fail = 1;
const StepState_pass  = 2;

@inline
export function step(): i32 {
    // Enable this line to print out the CPU registers, the current
    // instruction and the mini-dumps addressed by the register pairs.
    // console.log((new I8080_trace(cpu)).r);

    // Enable this to be able to interrupt the execution after each
    // instruction.
    // if (!confirm(i8080_trace(cpu))) return;
    let pc = cpu.pc;
    if (cpu.memory_read_byte(pc) == 0x76) {
      console.log('HLT at ' + hex16(pc));
      console.flush();
      return StepState_fail;
    }
    cpu.instruction();
    if (cpu.pc == 0) {
      cpu.instruction();
      console.flush();
      console.log('Jump to 0000 from ' + hex16(pc));
      console.log('Total cycles: ' + (I8080.cycles).toString() + ', Expected cycles: ' + expectedCycles.toString() + ', diff: ' + ((<i64>I8080.cycles) - expectedCycles).toString());
      return (success_check && !success) ? StepState_fail : StepState_pass;
    }
    return StepState_incomplete;
}

export function execute_test(): bool {
  let stepData = StepState_incomplete;
  while (!stepData) { stepData = step(); }
  return stepData == StepState_pass;
}

const tests: string[] = ['TEST.COM', 'CPUTEST.COM', '8080PRE.COM', '8080EX1.COM'];
const success_checks: bool[] = [false, false, true, false];
const cycle_test: i64[] = [20180, 255653383, 7817, 23803381171]

let expectedCycles: i64;

export function load_file(file: u8): void {
  const name = tests[file];
  const fileData = getData(name);
  if(fileData == null) {
    console.log('File ' + name + ' is not found');
    return;
  }

  const end: u16 = <u16>(fileData.start + fileData.image.length - 1);
  for(let i = fileData.start; i <= end; ++i) {
    cpu.memory_write_byte(i, unchecked(fileData.image[i - fileData.start]));
  }

  const size = fileData.end - fileData.start + 1;
  console.log('***** File ' + name + ' loaded, size ' + size.toString() + ' *****');

  // cpu.memory_write_byte(5, 0xC9);  // Inject RET at 0x0005 to handle 'CALL 5'.
  cpu.memory_write_byte(0, 0xD3);
  cpu.memory_write_byte(1, 0x00);

  cpu.memory_write_byte(5, 0xDB);
  cpu.memory_write_byte(6, 0x00);
  cpu.memory_write_byte(7, 0xC9);
  cpu.pc = 0x100;
  I8080.cycles = 0;
  success_check = success_checks[file];
  expectedCycles = cycle_test[file];
}

export function main(enable_exerciser: bool = false): void {
  console.log('Intel 8080/AS test');
  // i8080Console.putchar(<u8>('\n'.charCodeAt(0)));

  load_file(0);
  execute_test();
  load_file(1);
  execute_test();
  load_file(2);
  execute_test();

  // We may want to disable this test because it may take an hour
  // running in the browser. Within the standalone V8 interpreter
  // it works ~30 minutes.
  if (enable_exerciser) {
    load_file(3);
    execute_test();
  }
}
