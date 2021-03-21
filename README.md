# DEVOPS-17 Project

## Milestone 1

### Table of Contents
+ [Project Setup](#project-setup)
+ [Project Implementation](#project-implementation)
  - [Configure Jenkins and build environment](#configure-jenkins-and-build-environment)
  - [Trigger a build job](#trigger-a-build-job)
+ [Experiences and learnings about system setup](#experiences-and-learnings-about-system-setup)
+ [Issues Faced](#issues-faced)
+ [Screencast](#screencast)
+ [Checkpoint Progress Report](#checkpoint-progress-report)

### Project Setup
1. Clone the project.
2. Run: `npm intall`
3. Run: `npm link`

### Project Implementation
#### Configure Jenkins and build environment
`pipeline setup`

This command creates a new VM with static IP `192.168.33.20` and mounts the present working directory (`pwd`) onto `/bakerx` volume. It installs and configures Jenkins server, installs MongoDB, creates `MongoDB` user and installs `nodejs` required to run `checkbox.io` app.

#### Trigger a build job
`pipeline build <job_name> -u <jenkins_username> -p <jenkins_password>`

> -u and -p are optional parameters which default to `admin` and `admin`.

This command creates a new build job in Jenkins and triggers its build with the pipeline flow which can be seen in [pipeline.yml](cm/jobs/pipeline.yml) file.

### Experiences and learnings about system setup

* We felt that setting up the system via Ansible was much more easier than us having installed the services and dependencies through bash scripts. Using ansible modules is straightforward and we were sure that running the setup playbook again and again won't change the environment in the VM because of idempotency in Ansible modules. 

* Setting up the system requires knowledge on where certain system files are. For example, we needed to know the that the jenkins configuration file is in location `/etc/default/jenkins` so that the default port to run Jenkins server can be changed. Another example is the enabling of passwordless execution of `sudo` commands by the `jenkins` user. We had to google search and find that we needed to add the privilege for `jenkins` user in `/etc/sudoers` file.

* Setting up a system involves a lot of documentation reading and converting the instructions into code, be it Ansible playbook or bash script or a groovy file. One of the major parts of setting up system was also being able to search for the error properly. Because most of the services or softwares to be installed had already been used by a lot of people, oftentimes the solution to the error was discussed in the forum and we just needed to read and understand it and then try and adapt it for our specific scenario.

* Installing all these services also means that accounts need to be created and certain configuration parameters need to be set in a custom manner. This prompts the use of encrypting these variables since we might need to store username and password for certain services such as Jenkins and MongoDB as we need the setup process to be completely automatic. We can't afford to display the credentials in plain text for the services. Hence, we were able to learn and use the Ansible Vault service to encrypt the credentials and at the same time, use it in our ansible playbooks so we didn't have to hardcode the passwords in it.

### Issues Faced

* One of the main issues we faced was in the configuring and creating a build job in Jenkins. We had installed the `build-pipeline-plugin` referring to the guide for milestone 1 and the Jenkins workshop. However, when we launched the Jenkins UI and tried to create a build job manually, we weren't able to select the pipeline script option and add the Jenkinsfile. At first, we thought it was a configuration issue but later on after looking up at the Jenkins documentation for Pipelines, we understood that the plugin that was to be installed was `workflow-aggregator` rather than `build-pipeline-plugin`. When we made this change, we were able to create the build job manually as well as via code.

* When we changed the Jenkins port in the `/etc/default/jenkins` file, it didn't occur to us that we would have to restart the Jenkins server so that it would read the port change. We tried running the command again and again and were also able to see that the file was changed to reflect the new port. After some attempts, it dawned on us that the config file would be read when Jenkins would start and if we force jenkins to restart again, the config would be reloaded and the port change would be reflected.

* While executing the build for the pipeline job, we were not able to pass the 2nd test in the `npm test` command. The error that was shown was that of `MongoServerSelectionError` which meant that Mongo port or credentials wasn't able to be accessed. So, we cloned the `checkbox.io` repo in another directory and added some console.log statements in file db.js where mongo config parameters were fetched from the environment. This repo was then used in the Jenkinsfile rather than the git clone step and looking at the log of then created build made us understand that the variables weren't available to the Jenkinsfile. We then executed the npm test in a sudo shell which invoked the reloading of bash env variables and the tests passed successfully.

* Another issue occurred frequently when we made a clean `git clone` of our repo and would execute the pipeline setup command without ever creating the `.vault-pass` file. When the ansible task to copy the `vault-pass` file to the VM home directory would fail, we would realise that `vault-pass` would have to be created since it wasn't checked into Git. This happened sometimes and we made sure to check the contents of the directory so we would remember to create the `vault-pass` file before running `pipeline setup`.

* All the configuration parameters were stored in an encrypted variables yml file. To unencrypt that file and use those variables value in playbook, we had to pass the password file to the `ansible-playbook` command. Since we executed the run-ansible.sh file for the playbook, a third argument was passed to this shell file and processed and passed to the `ansible-playbook` command. When I made the change, when I would remotely trigger the `run-ansible.sh` via pipeline setup, I was not able to run it as the 3rd argument was never fetched. When I restarted the VM and my own machine and ran the same commands again, it started working and has been working ever since then. Sometimes, a simple restart can solve a bug.

### Screencast

Here's the link to the [screencast](https://drive.google.com/file/d/1b5FMlp4u2Kgrx-OtumWcB4Sue4Su4q36/view?usp=sharing).

### Checkpoint Progress Report

Navigate to [CHECKPOINT.md](CHECKPOINT.md).
