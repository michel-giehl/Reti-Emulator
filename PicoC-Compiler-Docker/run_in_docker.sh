#! /bin/sh

ulimit -t 10
ulimit -v $((2 * 1024 * 1024))
ulimit -m $((512 * 1024))

umask 0177

/usr/local/bin/picoc_compiler -p /home/picoc/file.picoc