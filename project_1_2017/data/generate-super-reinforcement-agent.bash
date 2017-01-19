#!/usr/bin/env bash
../program/flatland.py --agent reinforcement --training_rounds 25 --training_round_size 100 --learning_rate 0.01 --discount_factor 0.9 --train --save super-reinforcement-agent.pickle
