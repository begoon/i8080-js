/*
 * Part of Intel 8080/KR580VM80A in JavaScript project
 *
 * Copyright (C) 2009, 2012 Alexander Demin <alexander@demin.ws>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function hex(n, width) {
  return n.toString(16).toUpperCase().padStart(width, '0');
}

function dump_file(name) {
  let start = 0, end = 0, entry = 0;

  assert.ok(name.includes('.'), `Name '${name}'`);

  const contents = fs.readFileSync('files/' + name);
  const sz = contents.length;

  const ext = path.extname(name);

  let n = 0;

  // If the file name starts with "mon" this is an image of Monitor
  // (no sync-byte, start and end addresses at front).
  if (ext === ".bin" || ext === ".COM") {
    if (name.startsWith("mon")) {
      end = 0xffff;
      start = end - sz + 1;
      entry = 0xf800;
    } else if (ext ===".COM") {
      start = 0x100;
      end = start + sz - 1;
      entry = start;
    } else {
      end = sz;
      start = 0;
      entry = 0;
    }
  } else {
    // Is it the sync-byte (E6)?
    if (contents[n] == 0xe6) n += 1; 

    // start address
    start = (contents[n] << 8) | contents[n + 1];
    n += 2;

    // end address
    start = (contents[n] << 8) | contents[n + 1];
    n += 2;

    entry = start;
  }

  console.log(`files['${name}'] = {`);
  console.log(`start: 0x${hex(start, 4)},`);
  console.log(`end: 0x${hex(end, 4)},`);
  console.log(`entry: 0x${hex(entry, 4)},`);
  console.log(`image:`);

  let line = '"';
  let i = 0;
  while (start <= end) {
    assert.ok(n < sz, `n = ${n}, sz = ${sz}, start = ${start}, end = ${end}`);
    let c = contents[n];
    n += 1;
    line += hex(c, 2);
    i += 1;
    if (i >= 32) {
      i = 0;
      line += '"';
      if (start < end) line += ' +\n"';
    }
    ++start;
  }
  if (i > 0) line += '"';
  line += "\n};\n\n"
  console.log(line);
}

function main() {
  console.log("function preloaded_files() {");
  console.log("const files = [];\n");

  for (let file of fs.readdirSync('files')) {
    if (!file) continue;
    dump_file(file);
  }

  console.log("return files;");
  console.log("}\n");
}

main();
