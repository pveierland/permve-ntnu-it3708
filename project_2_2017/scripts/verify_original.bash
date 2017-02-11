#!/usr/bin/env bash

for i in {01..23}
do
    problem="../assignment/data/instances/p${i}"
    solution="../assignment/data/solutions/p${i}.res"
    echo "Verifying problem \"${problem}\" with solution \"${solution}\""
    ../program/mdvrp.py --problem ${problem} --solution ${solution} --verify
done
