.PHONY: build files

all: build files run

EXT = ts
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

files: build
	(cd files && $(LS) >..$(SLASH)files.lst)
	(cd files && ..$(SLASH)rkdump$(EXE) <..$(SLASH)files.lst) > files.$(EXT)

clean:
	-rm files.lst rkdump$(EXE) files.$(EXT) all.$(EXT)

run:
	open index.html

run-v8:
	v8 console.$(EXT) files.$(EXT) \
		i8080.$(EXT) i8080_disasm.$(EXT) i8080_trace.$(EXT) i8080_test.$(EXT) \
		main.$(EXT)

run-js:
	cat \
		console.$(EXT) files.$(EXT) i8080.$(EXT) i8080_disasm.$(EXT) i8080_trace.$(EXT) \
		i8080_test.$(EXT) main.$(EXT) > all.$(EXT)
	js -f all.$(EXT)

run-node: files
	$(CAT) \
		console.$(EXT) files.$(EXT) i8080.$(EXT) i8080_disasm.$(EXT) i8080_trace.$(EXT) \
		i8080_test.$(EXT) main.$(EXT) > all.$(EXT)
	tsc; node all.js

git-clean:
	git clean -fdx
