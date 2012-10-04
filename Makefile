.PHONY: build files

all: build files run

ifeq ($(OS),Windows_NT)
  CC = c:/tcc/tcc
  EXE = .exe
else
  CC = cc
endif

build:
	$(CC) -o rkdump$(EXE) rkdump.c

files:
	(cd files && ls -1 >../files.lst)
	(cd files && ../rkdump$(EXE) <../files.lst) > files.js

clean:
	-rm files.lst rkdump$(EXE) files.js all.js

run:
	open index.html

run-v8:
	v8 console.js files.js \
		i8080.js i8080_disasm.js i8080_trace.js i8080_test.js \
		main.js

run-js:
	cat \
		console.js files.js i8080.js i8080_disasm.js i8080_trace.js \
		i8080_test.js main.js > all.js
	js -f all.js
