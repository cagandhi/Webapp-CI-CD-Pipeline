const child = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

const sshSync = require('../lib/ssh');
const scpSync = require('../lib/scp');
const jenkins = require('jenkins')({ baseUrl: 'http://admin:admin@192.168.33.20:9000', crumbIssuer: true, promisify: true });

const readline = require('readline');

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

// let canaryReportPath = path.join(__dirname.split(path.sep).slice(0,-1).join(path.sep), 'canary', 'canary_report.txt');
let statsfilePath = path.join(__dirname.split(path.sep).slice(0,-1).join(path.sep), 'canary', 'stats.json');

const mwu = require('../lib/mannwhitneyu')
function canary_analysis() {
  let passed = 0;
  
  let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
  let obj = JSON.parse(statsFile);

  var report = "";

  let d;
  const sigvalue = 0.05;

  // cpu usage
  d = mwu.test(obj['blueCpu'], obj['greenCpu']);
  if (d.p < sigvalue) {
    report += "\nCPU usage: FAILED";
  } else {
    report += "\nCPU usage: PASSED";
    passed++;
  }

  // memory load
  d = mwu.test(obj['blueMemory'], obj['greenMemory']);
  if (d.p < sigvalue) {
    report += "\nMemory load: FAILED";
  } else {
    report += "\nMemory load: PASSED";
    passed++;
  }

  // latency
  d = mwu.test(obj['blueLatency'], obj['greenLatency']);
  if (d.p < sigvalue) {
    report += "\nLatency: FAILED";
  } else {
    report += "\nLatency: PASSED";
    passed++;
  }

  // status code
  d = mwu.test(obj['blueStatus'], obj['greenStatus']);
  if (d.p < sigvalue) {
    report += "\nStatus code: FAILED";
  } else {
    report += "\nStatus code: PASSED";
    passed++;
  }

  let total=4;
  report += `\n${passed} out of ${total} metrics passed !!`;

  let passedPercentage = passed/total;

  if(passedPercentage >= 0.75) {
    report += "\n\n----- CANARY PASSED -----";
  }
  else {
    report += "\n\n----- CANARY FAILED -----";
  }

  console.log(report);
}

// const mwu = require('mann-whitney-utest');
// function canary_analysis() {
//   let passed = 0;
  
//   let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
//   let obj = JSON.parse(statsFile);

//   console.log("\n Generating report ...");
//   var report = "";

//   var u, samples;
  
//   // cpu usage canary
//   samples = [obj['blueCpu'], obj['greenCpu']];
//   u = mwu.test(samples);

//   if( mwu.significant(u, samples) ) {
//     report += "\nCPU usage: FAILED";
//   }
//   else {
//     report += "\nCPU usage: PASSED";
//     passed++;
//   }

//   // memory load canary
//   samples = [obj['blueMemory'], obj['greenMemory']];
//   u = mwu.test(samples);

//   if( mwu.significant(u, samples) ) {
//     report += "\nMemory Load: FAILED";
//   }
//   else {
//     report += "\nMemory Load: PASSED";
//     passed++;
//   }

//   // latency canary
//   samples = [obj['blueLatency'], obj['greenLatency']];
//   u = mwu.test(samples);

//   if( mwu.significant(u, samples) ) {
//     report += "\nLatency: FAILED";
//   }
//   else {
//     report += "\nLatency: PASSED";
//     passed++;
//   }

//   // status code canary
//   samples = [obj['blueStatus'], obj['greenStatus']];
//   u = mwu.test(samples);

//   if( mwu.significant(u, samples) ) {
//     report += "\nStatus Code: FAILED";
//   }
//   else {
//     report += "\nStatus Code: PASSED";
//     passed++;
//   }

//   let total=4;
//   report += `\n${passed} out of ${total} metrics passed !!`;

//   let passedPercentage = passed/total;

//   if(passedPercentage >= 0.75) {
//     report += "\n\n----- CANARY PASSED -----\n";
//   }
//   else {
//     report += "\n\n----- CANARY FAILED -----\n";
//   }

//   // write to local server folder
//   fs.writeFileSync(canaryReportPath, report, (err) => {
//     if(err)
//       console.log(err);
//   });

//   // write to /bakerx
//   fs.writeFileSync('/bakerx/canary/canary_report.txt', report, (err) => {
//     if(err)
//       console.log(err);
//   });
// }


async function run(blueBranch, greenBranch) {

    console.log('stats json path :: '+statsfilePath);

    // delete canary stats json file if it exists in canary/ folder
    try {
        if(fs.existsSync(statsfilePath)){
            console.log('Removing existing stats json file ...');
            fs.unlinkSync(statsfilePath);
        }
    } catch(err) {

    }

    
    
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
    let extraVar = 'proxyIp='+proxyIP+' '+'blueBranch='+blueBranch+' '+'greenBranch='+greenBranch;
    // let extraVar = 'proxyIp='+proxyIP+' '+'blueBranch=master'+' '+'greenBranch=broken';

    console.log(chalk.yellow(`extra var :: ${extraVar}`));
    
    console.log(chalk.blueBright('Installing checkbox.io dependencies on blue and green VMs...'));
    let runCmd = '/bakerx/canary/run-ansible-vars.sh '+filePath+' '+inventoryPath+' '+vaultFilePath+' "'+extraVar+'"';
    console.log(chalk.yellow(`run command :: ${runCmd}`));
    result = sshSync(runCmd, 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

        

    // 1e. Start proxy.js and load generation and agent health collection 
    filePath = '/bakerx/canary/start-server-agent-proc-playbook.yml';
    inventoryPath = '/bakerx/canary/inventory.ini';
    vaultFilePath = '/bakerx/.vault-pass';

    console.log(chalk.yellow("Starting proxy and load generation..."));
    result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { console.log(result.error); process.exit( result.status ); }


    // 1f. wait for report file to be ready
    console.log(chalk.yellow('Waiting for canary report to be generated...'));
    while(true)
    {
        try {
            if(fs.existsSync(statsfilePath)) {

                filePath = '/bakerx/canary/stop-server-agent-proc-playbook.yml';
                inventoryPath = '/bakerx/canary/inventory.ini';
                vaultFilePath = '/bakerx/.vault-pass';

                console.log(chalk.yellow("\nStopping proxy and client agent health collection processes..."));
                result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
                if( result.error ) { console.log(result.error); process.exit( result.status ); }

                console.log("\n////////////////////////////////////");
                console.log(chalk.yellow('PRINTING CANARY REPORT ---'));
                canary_analysis();
                console.log("////////////////////////////////////\n");

                break;
            }
        } catch(err) {
            continue;
        }
    }
}
