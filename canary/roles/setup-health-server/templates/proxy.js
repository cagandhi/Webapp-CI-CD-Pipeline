const redis = require('redis');
const chalk = require('chalk');
const path = require('path');
const os = require('os');

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
// const statsfilePath = '/bakerx/canary/stats.json';

let obj={};

/// Servers data being monitored.
var servers =
[
  {name: "blue", url: BLUE, status: "#cccccc",  scoreTrend : [0], cpuList: [], memoryList: [], latencyList: [], statuscodeList: []},
  {name: "green", url: GREEN, status: "#cccccc",  scoreTrend : [0], cpuList: [], memoryList: [], latencyList: [], statuscodeList: []},
];

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

})();


function latency_status() {
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

        fs.writeFileSync(statsfilePath, JSON.stringify(obj), 'utf-8');
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

        fs.writeFileSync(statsfilePath, JSON.stringify(obj), 'utf-8');
        fs.copyFileSync(statsfilePath, '/bakerx/canary/stats.json');
      }
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

            latency_status();
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
