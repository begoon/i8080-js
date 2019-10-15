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
PREFIX = src$(SLASH)

build:
	$(CC) -o rkdump$(EXE) rkdump.c

files: build
	(cd files && $(LS) >..$(SLASH)files.lst)
	(cd files && ..$(SLASH)rkdump$(EXE) <..$(SLASH)files.lst) > $(PREFIX)files.$(EXT)

clean:
	-rm files.lst rkdump$(EXE) files.$(EXT) $(PREFIX)all.$(EXT)

run:
	open index.html

run-v8:
	v8 $(PREFIX)console.$(EXT) $(PREFIX)files.$(EXT) \
		$(PREFIX)i8080.$(EXT) $(PREFIX)i8080_disasm.$(EXT) $(PREFIX)i8080_trace.$(EXT) $(PREFIX)i8080_test.$(EXT) \
		$(PREFIX)main.$(EXT)

run-js:
	cat \
		$(PREFIX)console.$(EXT) $(PREFIX)files.$(EXT) $(PREFIX)i8080.$(EXT) $(PREFIX)i8080_disasm.$(EXT) $(PREFIX)i8080_trace.$(EXT) \
		$(PREFIX)i8080_test.$(EXT) $(PREFIX)main.$(EXT) > $(PREFIX)all.$(EXT)
	js -f $(PREFIX)all.$(EXT)

run-node: files
	tsc
	node build$(SLASH)main.js

git-clean:
	git clean -fdx
