# DEVOPS-17 Project

## Milestone 1

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

### Experiences

* We felt that setting up the system via Ansible was much more easier than us having installed the services and dependencies through bash scripts. Using ansible modules is straightforward and we were sure that running the setup playbook again and again won't change the environment in the VM because of idempotency in Ansible modules. 

* Setting up the system requires knowledge on where certain system files are. For example, we needed to know the that the jenkins configuration file is in location `/etc/default/jenkins` so that the default port to run Jenkins server can be changed. Another example is the enabling of passwordless execution of `sudo` commands by the `jenkins` user. We had to google search and find that we needed to add the privilege for `jenkins` user in `/etc/sudoers` file.

* Setting up a system involves a lot of documentation reading and converting the instructions into code, be it Ansible playbook or bash script or a groovy file. One of the major parts of setting up system was also being able to search for the error properly. Because most of the services or softwares to be installed had already been used by a lot of people, oftentimes the solution to the error was discussed in the forum and we just needed to read and understand it and then try and adapt it for our specific scenario.

* Installing all these services also means that accounts need to be created and certain configuration parameters need to be set in a custom manner. This prompts the use of encrypting these variables since we might need to store username and password for certain services such as Jenkins and MongoDB as we need the setup process to be completely automatic.

### Screencast

### [Checkpoint Progress Report ](CHECKPOINT.md)
