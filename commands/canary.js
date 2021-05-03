const child = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

const sshSync = require('../lib/ssh');
const scpSync = require('../lib/scp');
const jenkins = require('jenkins')({ baseUrl: 'http://admin:admin@192.168.33.20:9000', crumbIssuer: true, promisify: true });

const proxyIP = '192.168.44.92';

exports.command = 'canary <blueBranch> <greenBranch>';
exports.desc = 'Run canary analysis';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { blueBranch, greenBranch } = argv;

    (async () => {
        await run(blueBranch, greenBranch);
    })();

};

async function run(blueBranch, greenBranch) {

    
    /*

    // 1a. set up monitor/proxy VM
    console.log(chalk.yellow('Pulling queues image from bakerx'));
    let result = child.spawnSync(`bakerx`, `pull queues CSC-DevOps/Images#Spring2020`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    console.log(chalk.yellow('Provisioning monitoring/proxy server...'));
    result = child.spawnSync(`bakerx`, `run monitor1 queues --ip ${proxyIP} --sync`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    */



    // //  1a (a) Copy bakerx private key to vm
    // console.log(chalk.yellow('Create .bakerx directory in home'));
    // result = sshSync('mkdir -p /home/vagrant/.bakerx', 'vagrant@192.168.33.20');
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }

    // console.log(chalk.yellow('Copy private key to config-srv VM so that it connect to blue and green VMs to execute ansible playbook'));
    // let identifyFile = path.join(os.homedir(), '.bakerx', 'insecure_private_key');
    // result = scpSync(identifyFile, `vagrant@192.168.33.20:/home/vagrant/.bakerx/insecure_private_key`);
    // if( result.error ) { console.log(result.error); process.exit( result.status ); }



        

    // 1b. Set up proxy service on proxy/monitor VM, start health agents on server
    let filePath = '/bakerx/canary/proxy-playbook.yml';
    let inventoryPath = '/bakerx/canary/inventory.ini';
    let vaultFilePath = '/bakerx/.vault-pass';

    console.log(chalk.blueBright('Installing proxy code and health server on proxy/monitor VM...'));
    result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    

    /*

    // 1c. set up blue and green VMs
    console.log(chalk.yellow('Provisioning blue and green VMs'));
    result = child.spawnSync(`bakerx`, `run`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }


    */
    


    // 1d. Install checkbox.io microservice dependencies on blue and green VMs, setup health agents and start service
    filePath = '/bakerx/canary/bluegreen-playbook.yml';
    inventoryPath = '/bakerx/canary/inventory.ini';
    vaultFilePath = '/bakerx/.vault-pass';

    // hardcoded blue and green branch values because as instructed by TA, blue always contains master and green always contains broken
    // let extraVar = 'proxyIp='+proxyIP+' '+'blueBranch='+blueBranch+' '+'greenBranch='+greenBranch;
    let extraVar = 'proxyIp='+proxyIP+' '+'blueBranch=master'+' '+'greenBranch=broken';

    console.log(chalk.yellow(`extra var :: ${extraVar}`));
    
    console.log(chalk.blueBright('Installing checkbox.io dependencies on blue and green VMs...'));
    let runCmd = '/bakerx/canary/run-ansible-vars.sh '+filePath+' '+inventoryPath+' '+vaultFilePath+' "'+extraVar+'"';
    console.log(chalk.yellow(`run command :: ${runCmd}`));
    result = sshSync(runCmd, 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

        

    // 1e. Start proxy.js and load generation
    filePath = '/bakerx/canary/start-proxy-playbook.yml';
    inventoryPath = '/bakerx/canary/inventory.ini';
    vaultFilePath = '/bakerx/.vault-pass';

    console.log(chalk.yellow("Starting proxy and load generation..."));
    result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }
}
