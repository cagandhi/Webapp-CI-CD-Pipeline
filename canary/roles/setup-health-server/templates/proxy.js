const redis = require('redis');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const mwu = require('mann-whitney-utest');
const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');
const execSync = require('child_process').execSync;
const fs = require('fs');

const BLUE  = 'http://192.168.44.25:3000/preview';
const GREEN = 'http://192.168.44.30:3000/preview';

let client = redis.createClient(6379, 'localhost', {});
let reqTime=20; // time in ms at which request will be sent - change to 10
let maxReqCnt=(60*1000)/reqTime; // no of times request can be sent in 1 min - change nr to 60
let latencyTime=1000;
let maxLatReqCnt=(60*1000)/latencyTime;

var blueStart=-1, blueEnd=-1, greenStart=-1, greenEnd=-1;

const statsfilePath = '/home/vagrant/server/stats.json';
const canaryReportPath = '/home/vagrant/server/canary_report.txt';

let obj={};

/// Servers data being monitored.
var servers =
[
  {name: "blue", url: BLUE, status: "#cccccc",  scoreTrend : [0], cpuList: [], memoryList: [], latencyList: [], statuscodeList: []},
  {name: "green", url: GREEN, status: "#cccccc",  scoreTrend : [0], cpuList: [], memoryList: [], latencyList: [], statuscodeList: []},
];


// function score2color(score)
// {
//   if (score <= 0.25) return "#ff0000";
//   if (score <= 0.50) return "#ffcc00";
//   if (score <= 0.75) return "#00cc00";
//   return "#00ff00";
// }

// // TASK 3
// function updateHealth(server)
// {
//     // Update score calculation.
//     let score = 0;
//     // let scflag, latflag, cpuflag, memflag;

//     // if( server.statusCode == 200 )
//     //     scflag = 4;
//     // else
//     //     scflag = 0;

//     // if( server.latency <= 10 )
//     //     latflag = 1;
//     // else if( server.latency <= 8 )
//     //     latflag = 2;
//     // else if( server.latency <= 5 )
//     //     latflag = 3;
//     // else if( server.latency <= 2 )
//     //     latflag = 4;
//     // else
//     //     latflag = 0;

//     // if( server.cpu <= 70 )
//     //     cpuflag = 1;
//     // else if( server.cpu <= 50 )
//     //     cpuflag = 2;
//     // else if( server.cpu <= 40 )
//     //     cpuflag = 3;
//     // else if( server.cpu <= 20 )
//     //     cpuflag = 4;
//     // else
//     //     cpuflag = 0;

//     // if( server.memoryLoad <= 70 )
//     //     memflag = 1;
//     // else if( server.memoryLoad <= 50 )
//     //     memflag = 2;
//     // else if( server.memoryLoad <= 40 )
//     //     memflag = 3;
//     // else if( server.memoryLoad <= 20 )
//     //     memflag = 4;
//     // else
//     //     memflag = 0;

//     // score = Math.round((scflag+memflag+cpuflag+latflag)/4);

//     if( server.statusCode == 200 )
//      score++;
//     if( server.latency <= 10 )
//      score++;
//     if( server.cpu <= 50 )
//      score++;
//     if( server.memoryLoad <= 50 )
//      score++;

//     server.status = score2color(score/4);

//     console.log(`${server.name} ${score}`);

//     // Add score to trend data.
//     server.scoreTrend.push( (4-score));
//     if( server.scoreTrend.length > 100 )
//     {
//         server.scoreTrend.shift();
//     }
// }


class Production
{
    constructor()
    {
        this.TARGET = BLUE;
    }
    
    
    // TASK 1:
    proxy()
    {
        let options = {};
        let proxy   = httpProxy.createProxyServer(options);
        let self = this;
        // Redirect requests to the active TARGET (BLUE or GREEN)
        let server  = http.createServer(function(req, res)
        {
            // callback for redirecting requests.
            proxy.web( req, res, {target: self.TARGET } );
        });
        server.listen(3090);
   }

   failover()
   {
      this.TARGET = GREEN;
   }
   

   async healthCheck()
   {
      try
      {
         const response = await got(this.TARGET, {throwHttpErrors: false}); // TODO: convert this to post request and add survey.json in payload
         let status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);
         console.log( chalk`{grey Health check on ${this.TARGET}}: ${status}`);

         if( response.statusCode != 200 )
          this.failover();
      }
      catch (error) {
         console.log(error);
      }
   }
   

}

(() => 
{
  // remove stats json if it exists
  try {
    if(fs.existsSync(statsfilePath))
    {
      // file exists
      fs.unlinkSync(statsfilePath);
    }
  } catch(err) {
    
  }

  main();
  // canary_analysis();
})();


function latency_status(canary_analysis) {
  // latency blue
  let cntlatblue=0;
  var latencyblue = setInterval( function ()
  {
    if(cntlatblue>=maxLatReqCnt)
    {
      clearInterval(latencyblue);

      try {
        if(fs.existsSync(statsfilePath))
        {
          // file exists
          let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
          obj = JSON.parse(statsFile);
        }
      } catch(err) {
        obj = {};
      } finally {
        obj['blueLatency'] = servers[0].latencyList;
        obj['blueStatus'] = servers[0].statuscodeList;

        fs.writeFileSync(statsfilePath, JSON.stringify(obj), 'utf-8')
      }
    }

    let now=Date.now();
    let server={};

    console.log("blue latency")
    let res = got.post(BLUE, {
      json: JSON.parse(fs.readFileSync('survey.json', 'utf-8')),
      responseType: 'json',
      throwHttpErrors: false
    }).then(function(res)
    {
      // TASK 2
      server.statusCode = res.statusCode;
      server.latency = Date.now()-now;
    }).catch( e =>
    {
      server.statusCode = e.code;
      server.latency = latencyTime;
    }).finally( () => 
    {
      let x = servers[0];
      x.latencyList.push(server.latency);
      x.statuscodeList.push(server.statusCode);
    });

    cntlatblue++;
  }, latencyTime);

  // latency green
  let cntlatgreen=0;
  var latencygreen = setInterval( function ()
  {
    if(cntlatgreen>=maxLatReqCnt)
    {
      clearInterval(latencygreen);

      try {
        if(fs.existsSync(statsfilePath))
        {
          // file exists
          let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
          obj = JSON.parse(statsFile);
        }
      } catch(err) {
        obj = {};
      } finally {
        obj['greenLatency'] = servers[1].latencyList;
        obj['greenStatus'] = servers[1].statuscodeList;

        fs.writeFileSync(statsfilePath, JSON.stringify(obj), 'utf-8')
      }
      // let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
      // let obj = JSON.parse(statsFile);

      canary_analysis();

      // fs.writeFileSync(statsfilePath, JSON.stringify(obj), 'utf-8')
    }

    let now=Date.now();
    let server={};

    console.log("green latency")

    let res = got.post(GREEN, {
      json: JSON.parse(fs.readFileSync('survey.json', 'utf-8')),
      responseType: 'json',
      throwHttpErrors: false
    }).then(function(res)
    {
      // TASK 2
      server.statusCode = res.statusCode;
      server.latency = Date.now()-now;
    }).catch( e =>
    {
      server.statusCode = e.code;
      server.latency = latencyTime;
    }).finally( () => 
    {
      let x = servers[1];
      x.latencyList.push(server.latency);
      x.statuscodeList.push(server.statusCode);
    });
    cntlatgreen++;
  }, latencyTime);
}


function canary_analysis() {
  let passed = 0;
  
  let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
  let obj = JSON.parse(statsFile);

  console.log("\n Generating report ...");
  var report = "\nCANARY ANALYSIS\n";

  var u, samples;
  
  // cpu usage canary
  samples = [obj['blueCpu'], obj['greenCpu']];
  u = mwu.test(samples);

  if( mwu.significant(u, samples) ) {
    report += "\nCPU usage: FAILED";
  }
  else {
    report += "\nCPU usage: PASSED";
    passed++;
  }

  // memory load canary
  samples = [obj['blueMemory'], obj['greenMemory']];
  u = mwu.test(samples);

  if( mwu.significant(u, samples) ) {
    report += "\nMemory Load: FAILED";
  }
  else {
    report += "\nMemory Load: PASSED";
    passed++;
  }

  // latency canary
  samples = [obj['blueLatency'], obj['greenLatency']];
  u = mwu.test(samples);

  if( mwu.significant(u, samples) ) {
    report += "\nLatency: FAILED";
  }
  else {
    report += "\nLatency: PASSED";
    passed++;
  }

  // status code canary
  samples = [obj['blueStatus'], obj['greenStatus']];
  u = mwu.test(samples);

  if( mwu.significant(u, samples) ) {
    report += "\nStatus Code: FAILED";
  }
  else {
    report += "\nStatus Code: PASSED";
    passed++;
  }

  console.log(report);

  let passedPercentage = passed/4;

  if(passedPercentage >= 0.75) {
    report += "\n\n----- CANARY PASSED !! -----\n";
  }
  else {
    report += "\n\n----- CANARY FAILED !! -----\n";
  }

  fs.writeFileSync(canaryReportPath, report, (err) => {
    if(err)
      console.log(err);
  });
}

function main() {
  console.log("IN MAIN FUNCTION");

  let prod = new Production();
  prod.proxy();

  console.log("prod target is now BLUE :: "+prod.TARGET);
  let cmd1 = 'curl -X POST -H "Content-Type: application/json" --data @survey.json '+prod.TARGET;

  let cntblue=0, cntgreen=0;
  let surveyJson = JSON.parse(fs.readFileSync('/home/vagrant/server/survey.json'))
  // generate load
  var timerblue = setInterval(function() {
    if(cntblue>maxReqCnt)
    {
      clearInterval(timerblue);

      var timergreen = setInterval(function() {
        if(cntgreen > maxReqCnt)
        {
          clearInterval(timergreen);

          // store blue values in array
          client.lrange("blue", 60, -1, (err, data) => {
            for (var i = 0; i < data.length; i++) {
              console.log("blue :: "+i);
              let payload = JSON.parse(data[i]);
              servers[0].cpuList.push(payload.cpu);
              servers[0].memoryList.push(payload.memoryLoad);
            }
          });

          // store green values in array
          client.lrange("green", 0, 59, (err, data) => {
            for (var i = 0; i < data.length; i++) {
              console.log("green :: "+i);
              let payload = JSON.parse(data[i]);
              servers[1].cpuList.push(payload.cpu);
              servers[1].memoryList.push(payload.memoryLoad);
            }

            try {
              if(fs.existsSync(statsfilePath))
              {
                let statsFile = fs.readFileSync(statsfilePath, 'utf-8');
                obj = JSON.parse(statsFile);
              }
            } catch(err) {
              obj = {};
            } finally {
              for(var server of servers) {
                if(server.name == "blue") {
                  obj['blueCpu'] = server.cpuList;
                  obj['blueMemory'] = server.memoryList;
                }
                else if(server.name == "green") {
                  obj['greenCpu'] = server.cpuList;
                  obj['greenMemory'] = server.memoryList;
                }
              }
              fs.writeFileSync(statsfilePath, JSON.stringify(obj), 'utf-8')
            }

            latency_status(canary_analysis);
          });
        }

        let res = got.post(GREEN, {
          json: surveyJson,
          responseType: 'json',
          throwHttpErrors: false
        });

        // prod.TARGET=GREEN;
        // // console.log("prod target is now GREEN :: "+prod.TARGET);
        // let cmd1 = 'curl -X POST -H "Content-Type: application/json" --data @survey.json '+prod.TARGET;
        // execSync(cmd1, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'ignore', 'inherit'] });
        cntgreen++;
        console.log(chalk.yellow(`GREEN :: ${cntgreen}`));
      }, reqTime);
    }

    let res = got.post(BLUE, {
      json: surveyJson,
      responseType: 'json',
      throwHttpErrors: false
    });

    // // console.log("prod target is now BLUE :: "+prod.TARGET);
    // let cmd1 = 'curl -X POST -H "Content-Type: application/json" --data @survey.json '+prod.TARGET;
    // execSync(cmd1, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'ignore', 'inherit'] });
    cntblue++;
    console.log(chalk.yellow(`BLUE :: ${cntblue}`));

  }, reqTime);  
}
