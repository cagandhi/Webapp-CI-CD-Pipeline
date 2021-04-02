#!/bin/bash

# https://stackoverflow.com/a/56257417/6543250
sudo mysql -uroot -proot -P3306 <<EOF
DROP DATABASE IF EXISTS iTrust2_test
EOF
sudo kill -9 $(lsof -t -i:8080) || true
sudo kill -9 $(lsof -t -i:9001) || true
sudo kill $(pgrep chrome) || true
sudo kill -9 $(lsof -t -i:9436) || true
