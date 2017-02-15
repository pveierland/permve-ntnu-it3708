#!/usr/bin/env bash

set -e

for instance in `ls -1 ../assignment/data/instances`
do
    ./grid_search "${instance}"
done
