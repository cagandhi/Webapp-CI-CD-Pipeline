# DEVOPS-17 Project
## Milestone 2


### Experiences and learnings about system setup

* Using mutations to randomly modify code helped us learn how to expose potential faults in the codebase. We learned the impact of the quality of mutations applied. If not done intelligently, the code might result in compile failures preventing us from scrutinizing the scripts for faults. Jacoco plugin provides code coverage metrics for Java code via integration with Jacoco. The JaCoCo Maven plug-in provides the JaCoCo runtime agent to your tests and allows basic report creation.

* Setting up an external application is tough if the documentation is incomplete. Fortunately, for the iTrust application, the instructions to run the application were provided properly however the services or applications that needed to be setup wasn't specified properly. We don't think it is a bad thing but it led to a lot of headache when the packages and services we installed didn't actually integrate well with iTrust and we had to make changes. 

* Static analysis phase is important as it highlights important code smells. The metrics we recorded such as LOC of a function, nesting depth and max chains highlight important and potential issues in the code. A long method would probably be hard to understand for other people or the max chains highlights the need to follow the Law of Demeter principle.

### Issues Faced

* The tasks were computationally quite expensive. Our machines did not have enough resources to smoothly run all the tasks. Test prioritization for doing 1000 test runs was compute intensive. Running `useful-tests` for a large number of iterations took too long. Due to this, debugging and updating parameters for this task consumed a lot of time.

* While working on the static analysis part, one of the main issues was the proper interpretation of the syntax tree. Although esprima made it a lot easier to visualise the tree, we needed to understand the function which implemented the visitor pattern in order to properly visit all the child nodes and calculate the max depth and max chain. For the max depth, else if statements were previously considered as a child of the preceding if. However, we had to carefully look at the syntax tree and use the alternate property in the nested visitor function to compute the correct answer.

* Configuring the VM for the iTrust application had its own set of challenges. The main issue was timeouts and extremely slow installation of packages. The root cause of the issue was that iTrust is a heavy application and requires ample RAM on the VM for smooth execution. On a 1GB RAM VM, the installation of mysql froze the VM and in turn, one of the team members' laptops as well. Occasionally, we ran into Application not able to start error even when we ran the commands in a 4GB RAM VM. The solution that worked for us was to simply delete the VM and setup everything again. iTrust being a heavy application took a long time to build and that added to the headache. Overall, the build process of ITrust as an application was tricky but we are glad we were able to handle it and get it working.

### Screencast


### Checkpoint Progress Report

Here's the link to the [CHECKPOINT-M2.md](CHECKPOINT-M2.md).

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
