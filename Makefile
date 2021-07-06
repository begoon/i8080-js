.PHONY: build files

all: build files run

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
	-rm files.lst rkdump$(EXE) files.js all.js all-pre.js

run:
	open index.html

run-v8:
	v8 console.js files.js \
		i8080.js i8080_disasm.js i8080_trace.js i8080_test.js \
		main.js

run-js:
	$(CAT) \
		console.js files.js i8080.js i8080_disasm.js i8080_trace.js \
		i8080_test.js main.js > all.js
	js -f all.js

run-node-pre:
	$(CAT) \
		files.js i8080.js i8080_disasm.js i8080_trace.js \
		i8080_test.js > all-pre.js

run-node: run-node-pre
	$(CAT) all-pre.js main.js > all.js
	node all.js

run-node-ex1: run-node-pre
	$(CAT) all-pre.js main_ex1.js > all.js
	node all.js

git-clean:
	git clean -fdx
