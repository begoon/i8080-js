export class IO {
    input(port: u8): u8 { return 0; }
    output(port: u8, w8: u8): void {}
    interrupt(iff: bool): void {}
  }
  