const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const sshSync = require('../lib/ssh');
const jenkins = require('jenkins')({ baseUrl: 'http://admin:admin@192.168.33.20:9000', crumbIssuer: true, promisify: true });


exports.command = 'build <job_name>';
exports.desc = 'Run build job on jenkins server';
exports.builder = yargs => {
    yargs.options({
        user: {
            alias: 'u',
            describe: 'username for jenkins server',
            default: 'admin',
            type: 'string'
        },
        password: {
            alias: 'p',
            describe: 'password for jenkins server',
            default: 'admin',
            type: 'string'
        },
    });
};


exports.handler = async argv => {
    const { job_name, user, password } = argv;

    (async () => {

        if (!fs.existsSync(path.resolve(job_name))) {
            await run(job_name, user, password);
        }

        else {
            console.error(`job_name, user or password don't exist. Make sure to provide path from root of cm directory`);
        }

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

async function run(job_name, user, password) {

    console.log('Triggering build.')
    let buildId = await triggerBuild(`${job_name}`).catch( e => console.log(e));

    console.log(`Received ${buildId}`);
    let build = await getBuildStatus(`${job_name}`, buildId);
    console.log( `Build result: ${build.result}` );

    console.log(`Build output`);
    var log = await jenkins.build.logStream({name: `${job_name}`, number: buildId});

    log.on('data', function(text) {
      process.stdout.write(text);
    });

    log.on('error', function(err) {
      console.log('Error: ', err);
    });

    log.on('end', function() {
      console.log('--- end of pipeline execution ---');
    });
}
