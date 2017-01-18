#!/usr/bin/env bash

training_rounds=25
training_round_repetitions=30
training_round_size=100

parameters="--learning_rate 0.01 --train --training_rounds ${training_rounds} --training_round_repetitions ${training_round_repetitions} --training_round_size ${training_round_size}"

../program/flatland.py --agent supervised --sensor_range 1 ${parameters} > learning-curve-supervised-1-sensor-range-${training_rounds}-training-rounds-${training_round_size}-size-${training_round_repetitions}-repetitions.txt

../program/flatland.py --agent reinforcement --sensor_range 1 ${parameters} > learning-curve-reinforcement-1-sensor-range-${training_rounds}-training-rounds-${training_round_size}-size-${training_round_repetitions}-repetitions.txt

../program/flatland.py --agent reinforcement --sensor_range 3 ${parameters} > learning-curve-reinforcement-3-sensor-range-${training_rounds}-training-rounds-${training_round_size}-size-${training_round_repetitions}-repetitions.txt
