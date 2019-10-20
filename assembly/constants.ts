export const enum FLAGS {
    CARRY = 0x01,
    UN1 = 0x02,
    PARITY = 0x04,
    UN3 = 0x08,
    HCARRY = 0x10,
    UN5 = 0x20,
    ZERO = 0x40,
    NEG = 0x80
}

export const enum Register {
    B = 0,
    C = 1, 
    D = 2, 
    E = 3, 
    H = 4, 
    L = 5, 
    M = 6, 
    A = 7
}
