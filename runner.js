const fs = require('fs');

const wasmData = fs.readFileSync('out/untouched.wasm');

let myModule;

// ! Config
const optString = 'Run time: ';
const runCount = 3;
const CHUNKSIZE = 1024;
// ! Config

const memory = new WebAssembly.Memory({initial: 1000});

const trace = (mesg, n) => getString(myModule.instance.exports.memory, mesg) + (n ? " " : "") + Array.prototype.slice.call(arguments, 2, 2 + n).join(", ");

const getString = (memory, ptr) => {
  if (!memory) return "<yet unknown>";
  return getStringImpl(memory.buffer, ptr);
}

const getStringImpl = (buffer, ptr) => {
  const U32 = new Uint32Array(buffer);
  const U16 = new Uint16Array(buffer);
  let length = U32[(ptr - 4) >>> 2] >>> 1;
  let offset = ptr >>> 1;
  if (length <= CHUNKSIZE) return String.fromCharCode.apply(String, U16.subarray(offset, offset + length));
  const parts = [];
  do {
    const last = U16[offset + CHUNKSIZE - 1];
    const size = last >= 0xD800 && last < 0xDC00 ? CHUNKSIZE - 1 : CHUNKSIZE;
    parts.push(String.fromCharCode.apply(String, U16.subarray(offset, offset += size)));
    length -= size;
  } while (length > CHUNKSIZE);
  return parts.join("") + String.fromCharCode.apply(String, U16.subarray(offset, offset + length));
}

const runner = async () => { 
  const env = {memory, abort: () => {}, trace: (x) => { console.log(trace(x)); }};
  myModule = await WebAssembly.instantiate(wasmData, {env} );
  console.time(optString);
  for(let i = 0; i < runCount; i++) {
    console.time(optString + 'load: ');
    myModule.instance.exports.load_file(i);
    console.timeEnd(optString + 'load: ');
    console.time(optString + 'execute: ');
    myModule.instance.exports.execute_test();
    console.timeEnd(optString + 'execute: ');
  }
  console.timeEnd(optString);
}

runner();
