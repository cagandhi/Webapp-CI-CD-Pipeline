const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');

const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');

exports.command = 'useful-tests';
exports.desc = 'test suite analysis for detecting useful tests';
exports.builder = yargs => {
    yargs.options({
        privateKey: {
            describe: 'Install the provided private key on the configuration server',
            type: 'string'
        },
        n_iterations: {
            alias: 'c',
            describe: 'number of iterations',
            type: 'number'
        },
        gh_user: {
            alias: 'gh-user',
            describe: 'github.ncsu.edu username',
            type: 'string'
        },
        gh_pass: {
            alias: 'gh-pass',
            describe: 'github.ncsu.edu password',
            type: 'string'
        },
    });
};


exports.handler = async argv => {
    const { privateKey, n_iterations, gh_user, gh_pass } = argv;

    (async () => {

        await run( privateKey, n_iterations, gh_user, gh_pass );

    })();

};

async function run(privateKey, n_iterations, gh_user, gh_pass) {

    console.log(chalk.greenBright('Identifying useful tests...'));

    // if either of gh_user and gh_pass value is undefined but not both
    if(gh_user || gh_pass) {

        // if both gh_user and gh_pass are not undefined, execute "store the git credentials" shell file
        if(gh_user && gh_pass) {
            console.log(chalk.blueBright('Storing git credentials ...'));
            result = sshSync(`/bakerx/cm/add-git-cred.sh ${gh_user} ${gh_pass}`, 'vagrant@192.168.33.20');
            if( result.error ) { console.log(result.error); process.exit( result.status ); }
        }
        // if one of gh_user or gh_pass is passed but not both in the setup command, display error and exit
        else {
            console.log(chalk.red("Pass both github user and github password as CLI arguments"));
            process.exit(1);
        }
    }

    result = sshSync(`/bakerx/testanalysis/scripts/mutate_setup.sh ${n_iterations}`, 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }


    // // code to run test prioritization analysis and internally invoke fuzzer
    // console.log(chalk.greenBright('Cloning iTrust..'));
    // let itrust = 'https://'+ gh_user + ':' + gh_pass +'@github.ncsu.edu/engr-csc326-staff/iTrust2-v8.git'
    // // result = sshSync(`git clone -b main ${itrust} /home/vagrant/`, 'vagrant@192.168.33.20');
    // result = sshSync(`cd /home/vagrant/ && git clone -b main ${itrust} `, 'vagrant@192.168.33.20');
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }

    // console.log(chalk.greenBright('Installing fuzzer node modules...'));
    // result = sshSync('cd /bakerx/testanalysis/fuzzer && npm install', 'vagrant@192.168.33.20');
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }

    // result = sshSync('cp /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml.template /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml', 'vagrant@192.168.33.20');
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }

    // result = sshSync('. /etc/environment && sed -i "s/^    password:.*$/    password: $MYSQL_ROOT_PASSWORD/g" /home/vagrant/iTrust2-v8/iTrust2/src/main/resources/application.yml', 'vagrant@192.168.33.20');
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }

    // result = sshSync(`cd /bakerx/testanalysis/fuzzer && node index.js ${n_iterations}`, 'vagrant@192.168.33.20');
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }

}
