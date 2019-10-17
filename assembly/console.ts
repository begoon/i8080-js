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

class Console {
  public line: string = '';

  log(s: string): void {
    trace(s);
  }

  flush(): void {
    this.log("OUTPUT: " + this.line);
    this.line = "";
  }

  putchar(c: u8): void {
    if (c == 10) return;
    if (this.line == null) this.line = "";
    if (c == 13) {
      this.flush();
    } else {
      this.line += String.fromCharCode(c);
    }
  }
};

export const console = new Console();


