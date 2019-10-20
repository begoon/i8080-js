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
import {preloaded_files} from './files';
import {I8080} from './i8080';
import {hex16} from './utils';
import {Memory} from './memory';
import {IO} from './io';

import {I8080_trace} from './i8080_trace';

const files = preloaded_files();
const mem = new Memory(0x10000);
const cpu = new I8080(mem, new IO());

let success_check: boolean;
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
    if (mem.getUint8Unsafe(pc) == 0x76) {
      console.log('HLT at ' + hex16(pc));
      console.flush();
      return StepState_fail;
    }
    if (pc == 0x0005) {
      if (cpu.c == 9) {
        // Print till '$'.
        for (let i = cpu.de; mem.getUint8Unsafe(i) != 0x24; i += 1) {
          console.putchar(mem.getUint8Unsafe(i));
        }
        success = true;
      }
      if (cpu.c == 2) console.putchar(<u8>cpu.e);
    }
    cpu.instruction();
    if (cpu.pc == 0) {
      console.flush();
      console.log('Jump to 0000 from ' + hex16(pc));
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

export function load_file(file: u8): void {
  mem.load_file(files, tests[file]);
  mem.setUint8Unsafe(5, 0xC9);  // Inject RET at 0x0005 to handle 'CALL 5'.
  cpu.jump(0x100);
  success_check = success_checks[file];
}

export function main(enable_exerciser: boolean = false): void {
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
