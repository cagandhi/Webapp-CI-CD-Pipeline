const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const sshSync = require('../lib/ssh');


exports.command = 'prod up';
exports.desc = 'Provision cloud instances';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    
    (async () => {
        await run();
    })();

};

async function run() {

    let filePath = '/bakerx/provision/playbook.yml';
    let inventoryPath = '/bakerx/cm/inventory.ini';
    let vaultFilePath = '/bakerx/.vault-pass';

    console.log(chalk.blueBright('Provisioning cloud instances...'));
    let result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { process.exit( result.status ); }

    console.log(chalk.yellow("\nPrinting output inventory.ini for cloud instances ...\n"));
    let invFile = path.join(__dirname.split(path.sep).slice(0,-1).join(path.sep), 'inventory.ini');
    try {
        const data = fs.readFileSync(invFile, 'UTF-8');
        const lines = data.split(/\r?\n/);
        lines.forEach( (line) => {
            console.log(line);
        });
    } catch(err) {
        console.error(err);
    }
}
