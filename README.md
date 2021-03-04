# HW2-Template

### Get started

Clone this repo:

```bash
git clone https://github.com/CSC-DevOps/CM-Template
```

Change the remote url of the repo you just cloned, and push:

```bash
git remote set-url origin https://github.ncsu.edu/cscdevops-summer2020/HW2-<unityid>
git push -u origin master
```

Install the node.js packages.

```
npm install
npm link
```

You can run the `cm setup` command to help you:

1. Provision the configuration server VM (with ip, sync folders)
2. Provision the mattermost VM (with ip)
3. Copy over the private key for the mattermost VM.
4. Install ansible on the config server.

*Note*: You must run `cm setup` while your cwd is inside the HW2-DevOps folder in order for the current sync path to be setup.

The output should be similiar to the following:
```bash
$ cm setup
Installing configuration server!
Provisioning configuration server...
Creating ansible-srv using vbox...
⠋ Waiting for VM network to initialize... (can take a few seconds or minutes on slower hosts).
received from ssh server:  SSH-2.0-OpenSSH_7.6p1 Ubuntu-4ubuntu0.3

The VM is now ready. You can run this ssh command to connect to it.
ssh -i "/Users/cjparnin/.bakerx/insecure_private_key" vagrant@127.0.0.1 -p 2004 -o StrictHostKeyChecking=no
You may also run 'bakerx ssh ansible-srv' to connect to the machine.
Provisioning mattermost server...
Creating mattermost-srv using vbox...
⠋ Waiting for VM network to initialize... (can take a few seconds or minutes on slower hosts).
received from ssh server:  SSH-2.0-OpenSSH_7.6p1 Ubuntu-4ubuntu0.3

The VM is now ready. You can run this ssh command to connect to it.
ssh -i "/Users/cjparnin/.bakerx/insecure_private_key" vagrant@127.0.0.1 -p 2005 -o StrictHostKeyChecking=no
You may also run 'bakerx ssh mattermost-srv' to connect to the machine.
Installing privateKey on configuration server
Warning: Permanently added '192.168.33.10' (ECDSA) to the list of known hosts.
insecure_private_key                                                                                                                    100% 1675     2.0MB/s   00:00    
Running init script...
Warning: Permanently added '192.168.33.10' (ECDSA) to the list of known hosts.
+ sudo add-apt-repository ppa:ansible/ansible -y
Reading package lists...
+ sudo apt-get update
+ sudo apt-get install ansible -y
Reading package lists...
...
```

You can also run `cm playbook cm/playbook.yml cm/inventory.ini`.

If everything is working correctly, you should see that you can run your playbook and successfully ping the mattermost VM.
```
cjparnin at MacBookPro in ~/classes/csc-devops-staff/hw2 on master [!]
$ cm playbook cm/playbook.yml cm/inventory.ini 
Running ansible script...
Warning: Permanently added '192.168.33.10' (ECDSA) to the list of known hosts.
+ '[' 2 -ge 2 ']'
+ PLAYBOOK=/bakerx/cm/playbook.yml
+ INVENTORY=/bakerx/cm/inventory.ini
+ ansible-playbook /bakerx/cm/playbook.yml -i /bakerx/cm/inventory.ini

PLAY [mattermost] **************************************************************

TASK [Gathering Facts] *********************************************************
ok: [192.168.33.80]

TASK [ping : ping the webserver] ***********************************************
ok: [192.168.33.80]

PLAY RECAP *********************************************************************
192.168.33.80              : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
```

#### Check progress

You can check your progress by running:
```bash
opunit verify -i test/inventory.yml
```

### What is in this template repo

Similar to hw1 (V), here you have a cli node app called `cm`. The commands are defined in `./commands` directory, and your configuration management (Ansible) scripts are to be added in `./cm`. 

In `./cm` we included a template for the files you will need (`playbook.yml`, and `inventory.ini`), as well as an example for Ansible roles (`./cm/roles/ping`). 
