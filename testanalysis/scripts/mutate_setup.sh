#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
# set -x

c=$1

# remove iTrust2-v8 folder if it exists
if [ -d /home/vagrant/iTrust2-v8/ ]
then
	rm -rf /home/vagrant/iTrust2-v8/
	echo "existing directory iTrust2-v8 removed!!"
fi

# git clone iTrust2-v8
itrust="https://${GH_USER}:${GH_PASSWORD}@github.ncsu.edu/engr-csc326-staff/iTrust2-v8.git"
cd /home/vagrant/ && git clone -b main $itrust

# npm install fuzzer code packages
cd /bakerx/testanalysis/fuzzer && npm install

# replace mysql root password in application.yml
cp /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml.template /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml
. /etc/environment && sed -i "s/^    password:.*$/    password: $MYSQL_ROOT_PASSWORD/g" /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml

# call index.js in fuzzer to perform mutation testing with $c iterations
cd /bakerx/testanalysis/fuzzer && node index.js $c --colors
