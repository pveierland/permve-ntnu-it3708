#!/usr/bin/env bash

set -e

instance="p04"

figures_path="../report/figures"
mkdir -p ${figures_path}

program="../program/mdvrp.py --problem ../assignment/data/instances/${instance}"

${program} --render_grouping --render_filename ${figures_path}/grouping.pdf
${program} --render_routing --render_filename ${figures_path}/routing.pdf
${program} --render --render_filename ${figures_path}/solution.pdf --solution ../data/top/${instance}.res

cat "../data/top/${instance}.res"
