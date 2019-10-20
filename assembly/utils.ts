function singleHex(x: u8 /* 0 - 16 only */, upper: bool = false): string {
    // 87 = upper case, 87 - 32 (65) = lower case
    return x < 10 ? x.toString() : String.fromCharCode(x + (upper ? 65 : 87));
}

export function hex8(x: u8): string {
    return singleHex(x >> 4) + singleHex(x & 0x0f);
}

export function hex16(x: u16): string {
    return hex8(<u8>(x >> 8)) + hex8(<u8>x);
}