const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const sshSync = require('../lib/ssh');
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

    // 1a. set up monitor/proxy VM
    console.log(chalk.greenBright('Pulling queues image from bakerx'));
    let result = child.spawnSync(`bakerx`, `pull queues CSC-DevOps/Images#Spring2020`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    console.log(chalk.greenBright('Provisioning monitoring/proxy server...'));
    let result = child.spawnSync(`bakerx`, `run proxy queues --ip ${proxyIP} --sync`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    let ip = getIPAddress();
    console.log(chalk.greenBright(`Setting host network as ${ip}...`));
    fs.writeFileSync(path.join(__dirname, "/bakerx/canary/proxy_ip.txt"), ip);

    // 1b. Set up proxy service on proxy/monitor VM, start health agents on server
    let filePath = '/bakerx/canary/proxy-playbook.yml';
    let inventoryPath = '/bakerx/canary/inventory.ini';
    let vaultFilePath = '/bakerx/.vault-pass';

    console.log(chalk.blueBright('Installing proxy code and health server on proxy/monitor VM...'));
    let result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { process.exit( result.status ); }

    // 1c. set up blue and green VMs
    console.log(chalk.greenBright('Provisioning blue and green VMs'));
    let result = child.spawnSync(`bakerx`, `run`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    // 1d. Install checkbox.io microservice dependencies on blue and green VMs, setup health agents and start service
    let filePath = '/bakerx/canary/bluegreen-playbook.yml';
    let inventoryPath = '/bakerx/canary/inventory.ini';
    let vaultFilePath = '/bakerx/.vault-pass';

    console.log(chalk.blueBright('Installing checkbox.io dependencies on blue and green VMs...'));
    let result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { process.exit( result.status ); }

}

function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
  
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
          return alias.address;
      }
    }
  
    return '0.0.0.0';
  }


// let filePath;
// if(job_name == "checkbox.io") {
//     filePath = '/bakerx/deploy/checkbox_playbook.yml';
// }
// else if(job_name == "iTrust") {
//     filePath = '/bakerx/deploy/itrust_playbook.yml';
// }
// let inventoryPath = inventory;
// let vaultFilePath = '/bakerx/.vault-pass';

// console.log(chalk.blueBright(`Deploying ${job_name}...`));
// let result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
// if( result.error ) { process.exit( result.status ); }
