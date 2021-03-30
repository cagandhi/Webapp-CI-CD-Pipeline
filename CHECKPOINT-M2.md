# Milestone 2 - Checkpoint

## Table of Contents


* [Current Progress](#current-progress)
  + [Automatically configure a build environment and iTrust build job](#automatically-configure-a-build-environment-and-itrust-build-job)
  + [Github Project Board](#github-project-board)
  + [Execution of pipeline setup command](#execution-of-pipeline-setup-command)
* [Work to be done](#work-to-be-done)
* [Team contributions](#team-contributions)



## Current Progress

### Automatically configure a build environment and iTrust build job
* Parse github user and github password (dev token) in pipeline setup and store them in Jenkins credentials manager.
* Configure build environment to run iTrust by installing Maven and configuring MySQL server.
* Install google chrome and chromedriver required to run selenium integration tests in the VM.
* Configure the iTrust pipeline build job with the clean up operations.

### Github Project Board

![milestone2_board.png](imgs/project_board_m2.png)

### Execution of pipeline setup command

![build-itrust.png](imgs/output_m2.png)

## Work to be done

* Configure checkstyle and code coverage plugins in build job.
* Implement fuzzing and test suite analysis.
* Implement static analysis for checkbox.io.


## Team contributions

The unity ID of the member shown was responsible for the majority of the respective task.
* Configure build environment for iTrust and add git credentials in Jenkins credential manager - `cagandhi`
* Writing the build job and triggering it through pipeline build command - `dshah3`
* Refactor code, execute unit and integration tests on VM and install chrome utilities for iTrust test run - `rkshriva`

All team members were equally invested in bug solving and testing the configuration changes in the server on execution of ansible scripts.

