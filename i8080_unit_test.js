const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const I8080 = vm.runInNewContext(
  fs.readFileSync(__dirname + '/i8080.js', 'utf8') + '\nI8080'
);
const bytes = new Uint8Array(0x10000);
const accesses = [];
const interrupts = [];
const cpu = new I8080({
  read(addr) {
    accesses.push(['read', addr]);
    return bytes[addr];
  },
  write(addr, value) {
    accesses.push(['write', addr, value]);
    bytes[addr] = value;
  },
}, {
  input() { return 0; },
  output() {},
  interrupt(iff) { interrupts.push(iff); },
});

cpu.memory_write_word(0xffff, 0x1234);
assert.deepEqual(accesses, [['write', 0, 0x12], ['write', 0xffff, 0x34]]);
accesses.length = 0;
assert.equal(cpu.memory_read_word(0xffff), 0x1234);
assert.deepEqual(accesses, [['read', 0], ['read', 0xffff]]);

cpu.sp = 0xffff;
assert.equal(cpu.ret(), 0x1234);
assert.equal(cpu.pc, 0x1234);
assert.equal(cpu.sp, 1);

cpu.execute(0xfb);
cpu.execute(0xf3);
assert.deepEqual(interrupts, [1, 0]);

for (let opcode = 0; opcode < 256; opcode++) {
  for (const value of [0, 0x0f, 0x7f, 0x80, 0xff]) {
    for (const flags of [0, 0xff]) {
      bytes.fill(value);
      cpu.regs.fill(value);
      cpu.pc = 0x100;
      cpu.sp = 0x200;
      cpu.iff = 0;
      cpu.retrieve_flags(flags);
      cpu.execute(opcode);
      for (const flag of ['sf', 'zf', 'hf', 'pf', 'cf', 'iff']) {
        assert.ok(cpu[flag] === 0 || cpu[flag] === 1,
          `opcode ${opcode.toString(16)}: ${flag} must be a numeric bit`);
      }
    }
  }
}
console.log('i8080 regression checks passed');
