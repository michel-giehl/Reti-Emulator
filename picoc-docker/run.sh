#! /bin/sh

docker run --net=none -v ${PWD}/$1:/home/picoc/file.picoc --rm -it picoc