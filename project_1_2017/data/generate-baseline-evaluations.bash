#!/usr/bin/env bash

command="../program/flatland.py --agent baseline --baseline_prefer_right --evaluate 1000000"

${command} --baseline_prefer_avoid_wall > evaluate-baseline-prefer-right-go-straight-prefer-avoid-wall-1M.txt
${command} --baseline_take_food_near_wall > evaluate-baseline-prefer-right-go-straight-take-food-near-wall-1M.txt
${command} > evaluate-baseline-prefer-right-go-straight-1M.txt
${command} --baseline_go_sideways --baseline_prefer_avoid_wall > evaluate-baseline-prefer-right-go-sideways-prefer-avoid-wall-1M.txt
${command} --baseline_go_sideways --baseline_take_food_near_wall > evaluate-baseline-prefer-right-go-sideways-take-food-near-wall-1M.txt
${command} --baseline_go_sideways > evaluate-baseline-prefer-right-go-sideways-1M.txt
