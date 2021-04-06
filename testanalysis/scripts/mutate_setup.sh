#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

c=$1

itrust="https://${GH_USER}:${GH_PASSWORD}@github.ncsu.edu/engr-csc326-staff/iTrust2-v8.git"
cd /home/vagrant/ && git clone -b main $itrust
cd /bakerx/testanalysis/fuzzer && npm install
cp /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml.template /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml
. /etc/environment && sed -i "s/^    password:.*$/    password: $MYSQL_ROOT_PASSWORD/g" /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml
cd /bakerx/testanalysis/fuzzer && node index.js $c