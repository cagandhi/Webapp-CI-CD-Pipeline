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
            default: '/bakerx/provision/inventory.ini',
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

// --------------------------------------------------------------

async function getBuildStatus(job, id) {
    return new Promise(async function(resolve, reject)
    {
        console.log(`Fetching ${job}: ${id}`);
        let result = await jenkins.build.get(job, id);
        resolve(result);
    });
}

async function waitOnQueue(id) {
    return new Promise(function(resolve, reject)
    {
        jenkins.queue.item(id, function(err, item) {
            if (err) throw err;
            // console.log('queue', item);
            if (item.executable) {
                console.log('number:', item.executable.number);
                resolve(item.executable.number);
            } else if (item.cancelled) {
                console.log('cancelled');
                reject('canceled');
            } else {
                setTimeout(async function() {
                    resolve(await waitOnQueue(id));
                }, 5000);
            }
        });
    });
  }


async function triggerBuild(job)
{
    let queueId = await jenkins.job.build(job);
    let buildId = await waitOnQueue(queueId);
    return buildId;
}

//
// --------------------------------------------------------------

async function run(job_name, inventory) {

    let filePath;
    if(job_name == "checkbox.io") {
        filePath = '/bakerx/deploy/checkbox_playbook.yml';
    }
    else if(job_name == "iTrust") {
        filePath = '/bakerx/deploy/itrust_playbook.yml';
    }
    let inventoryPath = inventory;
    let vaultFilePath = '/bakerx/.vault-pass';
    
    console.log(chalk.blueBright(`Deploying ${job_name}...`));
    let result = sshSync(`/bakerx/cm/run-ansible.sh ${filePath} ${inventoryPath} ${vaultFilePath}`, 'vagrant@192.168.33.20');
    if( result.error ) { process.exit( result.status ); }

    // console.log('Triggering build.')
    // let buildId = await triggerBuild(`${job_name}`).catch( e => console.log(e));

    // console.log(`Received ${buildId}`);
    // let build = await getBuildStatus(`${job_name}`, buildId);
    // console.log( `Build result: ${build.result}` );

    // console.log(`Build output`);
    // var log = await jenkins.build.logStream({name: `${job_name}`, number: buildId});

    // log.on('data', function(text) {
    //   process.stdout.write(text);
    // });

    // log.on('error', function(err) {
    //   console.log('Error: ', err);
    // });

    // log.on('end', function() {
    //   console.log('--- end of pipeline execution ---');
    // });
}
