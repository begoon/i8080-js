const fs = require('fs');
const buf2 = fs.readFileSync('out/untouched.wasm');
const optString = 'Run time - opt: ';
let myModule;
  const runner = async () => {
  const CHUNKSIZE = 1024;

  function getString(memory, ptr) {
    if (!memory) return "<yet unknown>";
    return getStringImpl(memory.buffer, ptr);
  }
  function getStringImpl(buffer, ptr) {
    const U32 = new Uint32Array(buffer);
    const U16 = new Uint16Array(buffer);
    var length = U32[(ptr - 4) >>> 2] >>> 1;
    var offset = ptr >>> 1;
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
  
  function trace(mesg, n) {
    return("trace: " + getString(myModule.instance.exports.memory, mesg) + (n ? " " : "") + Array.prototype.slice.call(arguments, 2, 2 + n).join(", "));
  }

  const memory = new WebAssembly.Memory({initial: 1000});
  const myImports = {
    env: {
        memory,
        abort: () => {},
      trace: function(x) {
        const str = trace(x);
        console.log(str);
      // console.timeLog(optString, str)
      }
    }
  };

  // let request = new XMLHttpRequest();
  // request.open('GET', 'out/untouched.wasm');
  // request.responseType = 'arraybuffer';
  // request.send();

  // request.onload = async function() {
    // const bytes = request.response;
    myModule = await WebAssembly.instantiate(buf2, myImports );
    const disableLog = false;
    const runAll = false;
    const runCount = 1;
    console.time(optString);
    for(let i = 0; i < runCount; i++) {
      myModule.instance.exports.main(runAll, disableLog);
    }
  console.timeEnd(optString);
  // };
}

runner();
