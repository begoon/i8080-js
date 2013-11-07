Intel 8080 (KR580VM80A) microprocessor in JavaScript
====================================================

This project is an implementation of the Intel 8080 microprocessor in
JavaScript. This implementation passes successfully all tests for the
KR580VM80 clone of Intel 8080 used in the [i8080-core][] project.
The emulator is independent from particular hardware. Memory and IO
objects are passed as parameters to the constructor.

[i8080-core]: https://github.com/begoon/i8080-core

This implementation doesn't use JavaScript Typed Arrays, and also opcode
decoding is implemented in a disassembler way.

It is tested on Chrome (Mac, Windows) and Safari (Mac, Windows).

Build (Mac)
-----------

    make

This command will generate a test web page and launch the current web browser
(on Mac). This web will run 3 tests: TEST.COM, CPUTEST.COM, 8080PRE.COM.

When you open the JavaScript console in the browser, you should see the
following:

    Intel 8080/JS test
    *********************************
    File "TEST.COM" loaded, size 1793
    OUTPUT: MICROCOSM ASSOCIATES 8080/8085 CPU DIAGNOSTIC VERSION 1.0  (C) 1980
    OUTPUT: 
    OUTPUT: CPU IS OPERATIONAL
    Jump to 0000 from 14f
    *********************************
    File "CPUTEST.COM" loaded, size 19200
    OUTPUT: 
    OUTPUT: DIAGNOSTICS II V1.2 - CPU TEST
    OUTPUT: COPYRIGHT (C) 1981 - SUPERSOFT ASSOCIATES
    OUTPUT: ABCDEFGHIJKLMNOPQRSTUVWXYZ
    OUTPUT: CPU IS 8080/8085
    OUTPUT: BEGIN TIMING TEST
    OUTPUT: END TIMING TEST
    OUTPUT: CPU TESTS OK
    OUTPUT: 
    Jump to 0000 from 3b25
    *********************************
    File "8080PRE.COM" loaded, size 1024
    OUTPUT: 8080 Preliminary tests complete
    Jump to 0000 from 32f

The main test 8080EX1.COM only runs when you use a standalone JavaScript
interpreter (V8 or SpiderMonkey) because it may take longer than an hour.

    make run-v8

or

    make run-js

On Mac you can install V8 and JS (SpiderMonkey) via `brew`:

    brew install v8
    brew install spidermonkey

Benchmark
---------

Time to run all 4 tests (TEST.COM, CPUTEST.COM, 8080PRE.COM, 8080EX1.COM) on
MacBook Air 2GHz. The NodeJS test was performed on Windows 7 SP1 (i7 3.40GHz
64-bit).

Implementation | Language   | JavaScript engine  | Time 
---------------|------------|--------------------|------------
[i8080-core][] | ANSI-C     | -                  | 0m58.793s
i8080-js       | JavaScript | V8 3.9.24          | 35m0.627s
i8080-js       | JavaScript | SpiderMonkey 1.8.5 | 166m43.369s
i8080-js       | JavaScript | NodeJS 0.10.21     | 18m48.38s

Using the emulator
------------------

An example of embedding the emulator can be found in the file `i8080_test.js`.
You need to supply Memory and IO objects to the constructor of the I8080 class.
