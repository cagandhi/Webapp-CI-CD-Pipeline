#!/bin/bash

# https://stackoverflow.com/a/56257417/6543250
sudo mysql -uroot -proot -P3306 <<EOF
DROP DATABASE IF EXISTS temp_db
EOF
