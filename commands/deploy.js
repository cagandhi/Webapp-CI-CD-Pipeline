const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const sshSync = require('../lib/ssh');
const jenkins = require('jenkins')({ baseUrl: 'http://admin:admin@192.168.33.20:9000', crumbIssuer: true, promisify: true });


exports.command = 'deploy <job_name>';
exports.desc = 'Deploy app';
exports.builder = yargs => {
    yargs.options({
        inventory: {
            alias: 'i',
            describe: 'inventory file',
            default: '/bakerx/inventory.ini',
            type: 'string'
        },
    });
};


exports.handler = async argv => {
    const { job_name, inventory } = argv;

    (async () => {
        await run(job_name, inventory);
    })();

};

async function run(job_name, inventory) {

    let filePath;
    if(job_name == "checkbox.io") {
        filePath = '/bakerx/deploy/checkbox_playbook.yml';
    }
    else if(job_name == "iTrust") {
        filePath = '/bakerx/deploy/itrust_playbook.yml';
    }
    let inventoryPath = '/bakerx/' + inventory;
    let vaultFilePath = '/bakerx/.vault-pass';
    
    console.log(chalk.blueBright(`Deploying ${job_name}...`));
    let result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { process.exit( result.status ); }

}
