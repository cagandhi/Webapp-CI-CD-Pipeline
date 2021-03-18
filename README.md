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

This command creates a new build job in Jenkins and triggers its build with the set pipeline flow which can be seen in [pipeline.yml](cm/jobs/pipeline.yml) file.

### Experiences

### Screencast

### [Checkpoint Progress Report ](CHECKPOINT.md)
