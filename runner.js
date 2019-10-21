const fs = require('fs');

const wasmData = fs.readFileSync('out/optimized.wasm');

let myModule;

// ! Config
const optString = 'Run time: ';
const runCount = 1;
const testCount = 4;
const CHUNKSIZE = 1024;
// ! Config

const memory = new WebAssembly.Memory({initial: 10});

const trace = (mesg) => { console.log(getString(myModule.instance.exports.memory, mesg)); }
const abort = () => {};

const getString = (memory, ptr) => {
  if (!memory) return "<yet unknown>";
  return getStringImpl(memory.buffer, ptr);
}

const getLongStringImpl = (buffer, ptr) => {
  const U32 = new Uint32Array(buffer);
  const U16 = new Uint16Array(buffer);
  let length = U32[(ptr - 4) >>> 2] >>> 1;
  let offset = ptr >>> 1;
  const parts = [];
  do {
    const last = U16[offset + CHUNKSIZE - 1];
    const size = last >= 0xD800 && last < 0xDC00 ? CHUNKSIZE - 1 : CHUNKSIZE;
    parts.push(String.fromCharCode.apply(String, U16.subarray(offset, offset += size)));
    length -= size;
  } while (length > CHUNKSIZE);
  return parts.join("") + String.fromCharCode.apply(String, U16.subarray(offset, offset + length));
}

const getStringImpl = (buffer, ptr) => {
  const U32 = new Uint32Array(buffer);
  const U16 = new Uint16Array(buffer);
  let length = U32[(ptr - 4) >>> 2] >>> 1;
  let offset = ptr >>> 1;
  if (length <= CHUNKSIZE) return String.fromCharCode.apply(String, U16.subarray(offset, offset + length));
  return getLongStringImpl(buffer, ptr);
}

const runner = async () => { 
  const env = {memory, abort, trace};
  myModule = await WebAssembly.instantiate(wasmData, {env} );
  console.time(optString);
  for(let j = 0; j < runCount; j++) {
    for(let i = 0; i < testCount; i++) { 
      console.time(optString + 'load: ');
      myModule.instance.exports.load_file(i);
      console.timeEnd(optString + 'load: ');
      console.time(optString + 'execute: ');
      myModule.instance.exports.execute_test();
      console.timeEnd(optString + 'execute: ');
    }
  }
  console.timeEnd(optString);
}

runner();
