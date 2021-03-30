const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');

const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');

exports.command = 'setup';
exports.desc = 'Provision and configure the configuration server';
exports.builder = yargs => {
    yargs.options({
        privateKey: {
            describe: 'Install the provided private key on the configuration server',
            type: 'string'
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
    const { privateKey, gh_user, gh_pass } = argv;

    (async () => {

        await run( privateKey, gh_user, gh_pass );

    })();

};

async function run(privateKey, gh_user, gh_pass) {

    console.log(chalk.greenBright('Installing configuration server!'));

    console.log(chalk.blueBright('Provisioning configuration server...'));
    let result = child.spawnSync(`bakerx`, `run config-srv focal --ip 192.168.33.20 --sync --memory 4096`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

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

    console.log(chalk.blueBright('Running init script...'));
    result = sshSync('/bakerx/cm/server-init.sh', 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    console.log(chalk.blueBright('Setting up the Jenkins server and build environment ...'));
    result = sshSync('/bakerx/cm/run-ansible.sh /bakerx/cm/playbook.yml /bakerx/cm/inventory.ini /bakerx/.vault-pass', 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

}
