#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
# set -x

GHUSER="$1"
GHPWD="$2"

# if GH_USER env variable exists, update the value using sed; refer https://unix.stackexchange.com/a/66880
if [[ $GH_USER ]]
then
    sudo sed -i "s/^GH_USER=.*$/GH_USER=$GHUSER/g" /etc/environment
else
    # echo the GH_USER variable with the credential value and append the line to /etc/environment ; refer https://unix.stackexchange.com/a/382947
    echo "GH_USER=\"$GHUSER\"" | sudo tee -a /etc/environment
fi


if [[ $GH_PASSWORD ]]
then
    sudo sed -i "s/^GH_PASSWORD=.*$/GH_PASSWORD=$GHPWD/g" /etc/environment
else
    echo "GH_PASSWORD=\"$GHPWD\"" | sudo tee -a /etc/environment
fi

. /etc/environment
