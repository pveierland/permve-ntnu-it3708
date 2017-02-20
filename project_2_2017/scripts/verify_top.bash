#!/usr/bin/env bash

for instance in `ls -1 ../assignment/data/instances`
do
    problem="../assignment/data/instances/${instance}"
    solution="../data/top/${instance}.res"
    echo "Verifying problem \"${problem}\" with solution \"${solution}\""
    ../program/mdvrp.py --problem ${problem} --solution ${solution} --verify
done
