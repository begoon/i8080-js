Intel 8080 (KR580VM80A) microprocessor in JavaScript
====================================================

[![GitHub Action](https://github.com/begoon/i8080-js/actions/workflows/build.yml/badge.svg)](https://github.com/begoon/i8080-js)

This project is an implementation of the Intel 8080 microprocessor in
JavaScript. This implementation passes successfully all tests for the
KR580VM80 clone of Intel 8080 used in the [i8080-core][] project.
The emulator is independent from particular hardware. Memory and IO
objects are passed as parameters to the constructor.

[i8080-core]: https://github.com/begoon/i8080-core

This implementation doesn't use JavaScript Typed Arrays, and also opcode
decoding is implemented in a disassembler way.

It is tested in Chrome, Safari, Firefox, Opera, and a few standalone
command line JavaScript interpreters.

This Intel 8080 engine powers the [rk86-js][] emulator of the Radio-86RK
microcomputer running at [rk86.ru][].

[rk86-js]: https://github.com/begoon/rk86-js
[rk86.ru]: https://rk86.ru

Build (Mac)
-----------

    make

This command will generate a test web page and launch the current web browser
(on Mac). This web will run 3 tests: TEST.COM, CPUTEST.COM, 8080PRE.COM.

When you open the JavaScript console in the browser, you should see the
following:

    Intel 8080/JS test
    |||||||||||||||||||||||||||||||||
    > RUNNING TEST
    *********************************
    File "TEST.COM" loaded, size 1793
    OUTPUT: MICROCOSM ASSOCIATES 8080/8085 CPU DIAGNOSTIC VERSION 1.0  (C) 1980
    OUTPUT:
    OUTPUT: CPU IS OPERATIONAL
    Jump to 0000 from 14f
    |||||||||||||||||||||||||||||||||
    > TEST TEST.COM succeed
    |||||||||||||||||||||||||||||||||
    > RUNNING TEST
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
    |||||||||||||||||||||||||||||||||
    > TEST CPUTEST.COM succeed
    |||||||||||||||||||||||||||||||||
    > RUNNING TEST
    *********************************
    File "8080PRE.COM" loaded, size 1024
    OUTPUT: 8080 Preliminary tests complete
    Jump to 0000 from 32f
    |||||||||||||||||||||||||||||||||
    > TEST 8080PRE.COM succeed

The main test 8080EX1.COM only runs when you use a standalone JavaScript
interpreter because it may take longer, up to a few minutes.

`Makefile` has targets for run with Node, V8, Deno, Bun, SpiderMonkey (`js`)
and JavaScriptCore (`jsc`).

Node, V8, Deno and SpiderMonkey on Mac can be installed via `brew`:

    brew insrall node
    brew install v8
    brew install deno
    brew install spidermonkey

`bun.sh` can be installed manually from <https://bun.sh/>.

`JavaScriptCore` (`jsc`) is usually installed on Mac automatically.
The following command help to find the location of the executable:

    find / -name jsc -type f 2>/dev/null

It may print something like:

    /System/iOSSupport/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
    /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
    /System/Volumes/Update/mnt1/System/iOSSupport/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
    /System/Volumes/Update/mnt1/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
    /System/Volumes/Data/System/iOSSupport/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
    /System/Volumes/Data/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc

Then it can be added to `PATH`.

The following commands run TEST.COM, CPUTEST.COM, 8080PRE.COM tests only
similar to `make run`.

    make run-node
    make run-v8
    make run-deno
    make run-bun
    make run-javascriptcore
    make run-spidermonkey

The following command also runs the main test `8080EX1.COM`. It may take
a few minutes.

    make run-node-ex1
    make run-v8-ex1
    make run-deno-ex1
    make run-bun-ex1
    make run-javascriptcore-ex1
    make run-spidermonkey-ex1

Benchmark
---------

Time to run all 4 tests (TEST.COM, CPUTEST.COM, 8080PRE.COM, 8080EX1.COM) on
MacBook Pro (13-inch, M1, 2020).

Implementation | Language   | JavaScript engine | Version     | Time
---------------|------------|-------------------|-------------|------------
[i8080-core][] | ANSI-C     | -                 | -           | 0:16
i8080-js       | JavaScript | node 18.7.0       | 18.7.0      | 1:32
i8080-js       | JavaScript | v8 10.2.154.4     | 10.2.154.4  | 1:34
i8080-js       | JavaScript | deno 1.24.3       | 1.24.3      | 1:32
i8080-js       | JavaScript | bun 0.1.8         | 0.1.8       | 1:07
i8080-js       | JavaScript | jsc               | 613.2.7     | 1:12
i8080-js       | JavaScript | js (91.12.0)      | 91.12.0     | 2:52

Clearly, `node`/`v8`/`deno` demonstrate similar timing because they are based
on V8.

`bun` and `jsc` are similar because they are JavaScriptCode.

`js` (SpiderMonkey) is on its own.

Using the emulator
------------------

An example of embedding the emulator can be found in the file `i8080_test.js`.
You need to supply Memory and IO objects to the constructor of the I8080 class.
