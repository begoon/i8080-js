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
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

int dump_file(const char* name) {
  char dump_name[1024];
  FILE* f;
  int start, end, entry;
  unsigned char ch;
  char* period;
  int i;

  strcpy(dump_name, name);

  period = strchr(dump_name, '.');
  assert(period != NULL);

  f = fopen(name, "rb+");
  if (!f) {
    fprintf(stderr, "unable to open file [%s]\n", name);
    exit(1);
  }

  // If the file name starts with "mon" this is an image of Monitor
  // (no sync-byte, start and end addresses at front).
  if (!strcmp(period, ".bin") || !strcmp(period, ".COM")) {
    long sz;
    assert(fseek(f, 0L, SEEK_END) == 0);
    sz = ftell(f);
    assert(sz > -1L);

    if (!memcmp(name, "mon", 3)) {
      end = 0xffff;
      start = end - sz + 1;
      entry = 0xf800;
    } else if (!strcmp(period, ".COM")) {
      start = 0x100;
      end = start + sz - 1;
      entry = start;
    } else {
      end = sz;
      start = 0;
      entry = 0;
    }

    assert(fseek(f, 0L, SEEK_SET) == 0);
  } else {
    // Is it the sync-byte (E6)?
    fread(&ch, 1, 1, f);  
    if (ch == 0xe6) fread(&ch, 1, 1, f); 

    // start address
    start = ch << 8;
    fread(&ch, 1, 1, f); start |= ch;

    // end address
    fread(&ch, 1, 1, f); end = ch << 8;
    fread(&ch, 1, 1, f); end |= ch;

    entry = start;
    *period = 0;
  }

  printf("files['%s'] = {\n", dump_name);
  printf("start: 0x%04x,\n", start);
  printf("end: 0x%04x,\n", end);
  printf("entry: 0x%04x,\n", entry);
  printf("image:\n");

  printf("\"");
  i = 0;
  while (start <= end) {
    char ch;
    assert(!feof(f));
    fread(&ch, 1, 1, f);
    printf("\\x%02X", (unsigned char)ch);
    ++i;
    if (i >= 32) {
      i = 0;
      printf("\"");
      if (start < end) printf(" +\n\"");
    }
    ++start;
  }
  if (i > 0) printf("\"");
  printf("\n};\n\n");

  fclose(f);

  return 0;
}

int main(int argc, char* argv[]) {

  if (argc == 2) return dump_file(argv[1]);

  printf("function preloaded_files() {\n");
  printf("var files: {[key: string]: {image: string, start: number, end: number, entry: number}} = {};\n");

  while (!feof(stdin)) {
    char line[1024];
    int sz;
    char* p;

    fgets(line, sizeof(line), stdin);
    sz = strlen(line);
    if (!sz) break;
    p = line + strlen(line) - 1;
    while (p != line && (*p == '\r' || *p == '\n')) *p-- = 0;

    dump_file(line);
  }

  printf("return files;\n");
  printf("}\n");

  return 0;
}
