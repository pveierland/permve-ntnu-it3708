#!/usr/bin/env bash

# ACO 1190 makespan (400 + 400 + 390)

convert -density 72 solution_aco_instance_3.pdf -quality 100 solution_aco_instance_3.png
convert solution_aco_instance_3.png -crop 29124x1584+0+0 solution_aco_instance_3_1.png
convert solution_aco_instance_3.png -crop 29088x1584+28836+0 solution_aco_instance_3_2.png
convert solution_aco_instance_3.png -crop 28368x1584+57636+0 solution_aco_instance_3_3.png

convert solution_aco_instance_3_1.png -resize 9708x528 solution_aco_instance_3_1_scaled.png
convert solution_aco_instance_3_2.png -resize 9696x528 solution_aco_instance_3_2_scaled.png
convert solution_aco_instance_3_3.png -resize 9432x528 solution_aco_instance_3_3_scaled.png

# BA 1185 makespan (400 + 400 + 385)

convert -density 72 solution_ba_instance_3.pdf -quality 100 solution_ba_instance_3.png
convert solution_ba_instance_3.png -crop 29124x1584+0+0 solution_ba_instance_3_1.png
convert solution_ba_instance_3.png -crop 29088x1584+28836+0 solution_ba_instance_3_2.png
convert solution_ba_instance_3.png -crop 28008x1584+57636+0 solution_ba_instance_3_3.png

convert solution_ba_instance_3_1.png -resize 9708x528 solution_ba_instance_3_1_scaled.png
convert solution_ba_instance_3_2.png -resize 9696x528 solution_ba_instance_3_2_scaled.png
convert solution_ba_instance_3_3.png -resize 9312x528 solution_ba_instance_3_3_scaled.png

# PSO 1190 makespan (400 + 400 + 390)

convert -density 72 solution_pso_instance_3.pdf -quality 100 solution_pso_instance_3.png
convert solution_pso_instance_3.png -crop 29124x1584+0+0 solution_pso_instance_3_1.png
convert solution_pso_instance_3.png -crop 29088x1584+28836+0 solution_pso_instance_3_2.png
convert solution_pso_instance_3.png -crop 28368x1584+57636+0 solution_pso_instance_3_3.png

convert solution_pso_instance_3_1.png -resize 9708x528 solution_pso_instance_3_1_scaled.png
convert solution_pso_instance_3_2.png -resize 9696x528 solution_pso_instance_3_2_scaled.png
convert solution_pso_instance_3_3.png -resize 9432x528 solution_pso_instance_3_3_scaled.png