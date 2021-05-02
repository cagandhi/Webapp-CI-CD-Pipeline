const redis = require('redis');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
//const mwu = require('mann-whitney-utest');
const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');
const execSync = require('child_process').execSync;
const fs = require('fs');

const BLUE  = 'http://192.168.44.25:3000/preview';
const GREEN = 'http://192.168.44.30:3000/preview';

var blueStart=-1, blueEnd=-1, greenStart=-1, greenEnd=-1;

/// Servers data being monitored.
var servers =
[
  {name: "blue", url:'http://192.168.44.25:3000', status: "#cccccc",  scoreTrend : [0], cpuList: [], memoryList: [], latencyList: [], statuscodeList: []},
  {name: "green", url:'http://192.168.44.30:3000', status: "#cccccc",  scoreTrend : [0], cpuList: [], memoryList: [], latencyList: [], statuscodeList: []},
];


function score2color(score)
{
  if (score <= 0.25) return "#ff0000";
  if (score <= 0.50) return "#ffcc00";
  if (score <= 0.75) return "#00cc00";
  return "#00ff00";
}

// TASK 3
function updateHealth(server)
{
    // Update score calculation.
    let score = 0;
    // let scflag, latflag, cpuflag, memflag;

    // if( server.statusCode == 200 )
    //     scflag = 4;
    // else
    //     scflag = 0;

    // if( server.latency <= 10 )
    //     latflag = 1;
    // else if( server.latency <= 8 )
    //     latflag = 2;
    // else if( server.latency <= 5 )
    //     latflag = 3;
    // else if( server.latency <= 2 )
    //     latflag = 4;
    // else
    //     latflag = 0;

    // if( server.cpu <= 70 )
    //     cpuflag = 1;
    // else if( server.cpu <= 50 )
    //     cpuflag = 2;
    // else if( server.cpu <= 40 )
    //     cpuflag = 3;
    // else if( server.cpu <= 20 )
    //     cpuflag = 4;
    // else
    //     cpuflag = 0;

    // if( server.memoryLoad <= 70 )
    //     memflag = 1;
    // else if( server.memoryLoad <= 50 )
    //     memflag = 2;
    // else if( server.memoryLoad <= 40 )
    //     memflag = 3;
    // else if( server.memoryLoad <= 20 )
    //     memflag = 4;
    // else
    //     memflag = 0;

    // score = Math.round((scflag+memflag+cpuflag+latflag)/4);

    if( server.statusCode == 200 )
     score++;
    if( server.latency <= 10 )
     score++;
    if( server.cpu <= 50 )
     score++;
    if( server.memoryLoad <= 50 )
     score++;

    server.status = score2color(score/4);

    console.log(`${server.name} ${score}`);

    // Add score to trend data.
    server.scoreTrend.push( (4-score));
    if( server.scoreTrend.length > 100 )
    {
        server.scoreTrend.shift();
    }
}

function saveHealth(server) {
  let x;
  if( server.name == "blue" ) {
    x = servers[0];

    if(blueStart == -1 || blueEnd == -1)
      console.log(server);

    else if(server.timestamp >= blueStart && server.timestamp <= blueEnd) {
      x.cpuList.push(server.cpu);
      x.memoryList.push(server.memoryLoad);
    }

  }
  else if( server.name == "green" ) {
    x = servers[1];

    if(greenStart == -1 || greenEnd == -1)
      console.log(server);

    else if(server.timestamp >= greenStart && server.timestamp <= greenEnd) {
      x.cpuList.push(server.cpu);
      x.memoryList.push(server.memoryLoad);
    }
  }
  console.log(chalk.yellow(`\n${server.name} -- ${server.timestamp}`));
  console.log(x.cpuList);
  console.log(x.memoryList);
  
}

class Production
{
    constructor()
    {
        this.TARGET = BLUE;
        // setInterval( this.healthCheck.bind(this), 5000 );
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
  // Get agent name from command line.
  
  console.log("BEFORE MAIN FUNCTION");
  main();
  console.log("BEFORE START FUNCTION");
  start();
  console.log("BEFORE CONNSOLEFUNC");
  consoleFunc();

})();

function consoleFunc() {
  console.log("IN CONNSOLEFUNC");
  // ////////////////////////////////////////////////////////////////////////////////////////
  console.log("\n// ////////////////////////////////////////////////////////////////////////////////////////\n");
  for( var server of servers ) {
    console.log(chalk.yellow("\nCPU LIST"));
    console.log(server.cpuList);
    console.log(chalk.yellow("\nMEMORY LOAD LIST"));
    console.log(server.memoryList);
    console.log(chalk.yellow("\nSTATUS CODE LIST"));
    console.log(server.statuscodeList);
    console.log(chalk.yellow("\nLATENCY LIST"));
    console.log(server.latencyList);
  }
  console.log("\n// ////////////////////////////////////////////////////////////////////////////////////////\n");
  // ////////////////////////////////////////////////////////////////////////////////////////
}

function start()
{
    console.log("IN START FUNCTION");
    // ////////////////////////////////////////////////////////////////////////////////////////
    // // DASHBOARD
    // ////////////////////////////////////////////////////////////////////////////////////////
    // const io = require('socket.io')(3000);
    // // Force websocket protocol, otherwise some browsers may try polling.
    // io.set('transports', ['websocket']);
    // // Whenever a new page/client opens a dashboard, we handle the request for the new socket.
    // io.on('connection', function (socket) {
    //     console.log(`Received connection id ${socket.id} connected ${socket.connected}`);

    //     if( socket.connected )
    //     {
    //         //// Broadcast heartbeat event over websockets ever 1 second
    //         var heartbeatTimer = setInterval( function ()
    //         {
    //             socket.emit("heartbeat", servers);
    //         }, 1000);

    //         //// If a client disconnects, we will stop sending events for them.
    //         socket.on('disconnect', function (reason) {
    //             console.log(`closing connection ${reason}`);
    //             clearInterval(heartbeatTimer);
    //         });
    //     }
    // });

    /////////////////////////////////////////////////////////////////////////////////////////
    // REDIS SUBSCRIPTION
    /////////////////////////////////////////////////////////////////////////////////////////
    let client = redis.createClient(6379, 'localhost', {});
    // We subscribe to all the data being published by the server's metric agent.
    for( var server of servers )
    {
        // The name of the server is the name of the channel to recent published events on redis.
        client.subscribe(server.name);
    }

    // When an agent has published information to a channel, we will receive notification here.
    client.on("message", function (channel, message)
    {
        // console.log(`Received message from agent: ${channel}`)
        for( var server of servers )
        {
            // Update our current snapshot for a server's metrics.
            if( server.name == channel)
            {
                let payload = JSON.parse(message);
                server.memoryLoad = payload.memoryLoad;
                server.cpu = payload.cpu;
                server.timestamp = payload.timestamp;
                // updateHealth(server);

                // if( server.timestamp > greenEnd )
                //   client.quit();

                saveHealth(server);
            }
        }
    });

    // LATENCY CHECK
    var latency = setInterval( function ()
    {
        for( var server of servers )
        {
            if( server.url )
            {
                let now = Date.now();

                // Bind a new variable in order to for it to be properly captured inside closure.
                let captureServer = server;

                // Make request to server we are monitoring.
                got(server.url, {timeout: 5000, throwHttpErrors: false}).then(function(res)
                {
                  // TASK 2
                  captureServer.statusCode = res.statusCode;
                  captureServer.latency = Date.now()-now;
                }).catch( e =>
                {
                  // console.log(e);
                  captureServer.statusCode = e.code;
                  captureServer.latency = 5000;
                }).finally( () => 
                {
                  let x = servers[server.name == "blue"?0:1];
                  x.latencyList.push(captureServer.latency);
                  x.statuscodeList.push(captureServer.statusCode);
                });
            }
        }
    }, 5000);
}


function main() {

  console.log("IN MAIN FUNCTION");

  console.log(chalk.keyword('pink')('Starting proxy on localhost:3090'));
//  let client = redis.createClient(6379, 'localhost', {});
  let prod = new Production();
  prod.proxy();

  // send loads to blue and green VMs

  console.log("prod target is now BLUE :: "+prod.TARGET);
  let cmd1 = 'curl -X POST -H "Content-Type: application/json" --data @survey.json '+prod.TARGET;
  const load_time = 60;

  blueStart = ((new Date()).getTime()/1000);

  let start_time = (new Date()).getTime()/1000;
  while(((new Date()).getTime()/1000) - start_time <= load_time)
  {

    execSync(cmd1, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'ignore', 'inherit'] });
    // let response = await got.post(prod.TARGET, 
    // {
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: form
    // }).catch( err => 
    //   console.error(err)
    // );
  }

  blueEnd = ((new Date()).getTime()/1000);
  
  prod.TARGET = GREEN;

  console.log("prod target is now GREEN :: "+prod.TARGET);
  cmd1 = 'curl -X POST -H "Content-Type: application/json" --data @survey.json '+prod.TARGET;

  greenStart = ((new Date()).getTime()/1000);

  start_time = (new Date()).getTime()/1000;
  while(((new Date()).getTime()/1000) - start_time <= load_time)
  {
    execSync(cmd1, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'ignore', 'inherit'] });
  }

  greenEnd = ((new Date()).getTime()/1000);
}


// console.log('siege blue');
  // // import { execSync } from 'child_process';  // replace ^ if using ES modules
  // let cmd = "siege -b -t60s --content-type 'application/json' '"+prod.TARGET+" POST < survey.json'";
  // console.log(cmd);
  // let output = execSync(cmd, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'inherit', 'inherit'] });

  // prod.TARGET = GREEN;

  // console.log("prod target changed now :: "+prod.TARGET);
  // console.log('siege green');

  // cmd = "siege -b -t60s --content-type 'application/json' '"+prod.TARGET+" POST < survey.json'";
  // console.log(cmd);
  // output = execSync(cmd, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'inherit', 'inherit'] });

    /*
    var latency = setInterval( function ()
    {
        for( var server of servers )
        {
            if( server.url )
            {
                let now = Date.now();

                // Bind a new variable in order to for it to be properly captured inside closure.
                let captureServer = server;

                // Make request to server we are monitoring.
                got(server.url, {timeout: 5000, throwHttpErrors: false}).then(function(res)
                {
                    // TASK 2
                    captureServer.statusCode = res.statusCode;
                    captureServer.latency = Date.now()-now;
                }).catch( e =>
                {
                    // console.log(e);
                    captureServer.statusCode = e.code;
                    captureServer.latency = 5000;
                });
            }
        }
    }, 10000);
    */

