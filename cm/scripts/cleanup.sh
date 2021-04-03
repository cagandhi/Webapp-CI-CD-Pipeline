#!/bin/bash

# Trace commands as we run them:
set -x

# https://stackoverflow.com/a/56257417/6543250
mysql --defaults-file=/etc/my.cnf <<EOF
DROP DATABASE IF EXISTS iTrust2_test
EOF

pid=$(sudo lsof -t -i:9001)
sudo kill -9 $pid | true

pid=$(sudo lsof -t -i:8080)
sudo kill -9 $pid | true

pid=$(sudo pgrep chrome)
sudo kill -9 $pid | true
