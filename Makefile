.PHONY: build files

all: build files run-ui

ifeq ($(OS),Windows_NT)
  CC = tcc
  EXE = .exe
  LS = dir /b
  CAT = type
  SLASH = "\"
else
  CC = cc
  LS = ls -1
  CAT = cat
  SLASH = /
endif

build:
	$(CC) -o rkdump$(EXE) rkdump.c

files:
	(cd files && $(LS) >..$(SLASH)files.lst)
	(cd files && ..$(SLASH)rkdump$(EXE) <..$(SLASH)files.lst) > files.js

clean:
	-rm files.lst rkdump$(EXE) files.js all.js

run-ui:
	open index.html

ONE_FILES=files.js i8080.js i8080_disasm.js i8080_trace.js i8080_test.js

pack: build files
	$(CAT) $(EXTRA) $(ONE_FILES) main$(EX1).js > all.js

run: pack
	$(ENGINE) $(ENGINE_FLAGS) all.js

run-v8:
	make run ENGINE=d8

run-v8-ex1:
	make run-v8 EX1=_ex1

run-javascriptcore run-jsc:
	make run ENGINE=jsc EXTRA=console.js

run-javascriptcore-ex1 run-jsc-ex1:
	make run-jsc EX1=_ex1

run-spidermonkey run-js:
	make run ENGINE=js

run-spidermonkey-ex1 run-js-ex1:
	make run-js EX1=_ex1

run-node:
	make run ENGINE=node

run-node-ex1:
	make run-node EX1=_ex1

run-deno:
	make run ENGINE=deno ENGINE_FLAGS=run

run-deno-ex1:
	make run-deno EX1=_ex1

run-bun:
	make run ENGINE=bun

run-bun-ex1:
	make run-bun EX1=_ex1

run-qjs:
	make run ENGINE=qjs ENGINE_FLAG=--std EXTRA=process.js

run-qjs-ex1:
	make run-qjs EX1=_ex1

git-clean:
	git clean -fdx
