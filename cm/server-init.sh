#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

# Script used to initialize your ansible server after provisioning.
sudo apt-get update
sudo apt install python3-pip -y
sudo pip3 install ansible
