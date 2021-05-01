const chalk = require('chalk');
const path = require('path');
const os = require('os');
//const mwu = require('mann-whitney-utest');
const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');
const execSync = require('child_process').execSync;


const BLUE  = 'http://192.168.44.25:3000/preview';
const GREEN = 'http://192.168.44.30:3000/preview';

//const blue_preview=`http://192.168.44.25:3000/preview`;
//const green_preview=`http://192.168.44.30:3000/preview`;


class Production
{
    constructor()
    {
        this.TARGET = BLUE;
        //this.server_id=0;
        setInterval( this.healthCheck.bind(this), 5000 );
    /*
    //https://stackoverflow.com/questions/6893130/how-to-set-one-minute-counter-in-javascript
    let minutes=1;

    setTimeout(() => {
            
            this.TARGET = BLUE;
            this.server_id= 1;
            
        }, minutes*60*1000);
        
        
    setTimeout(() => {
        
        this.TARGET = GREEN;
        this.server_id = 0;      
        }, 2*minutes*60*1000);
        */
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

(async () => 
{
    // Get agent name from command line.
    
    await main();

})();

async function main() {

  console.log(chalk.keyword('pink')('Starting proxy on localhost:3090'));
//  let client = redis.createClient(6379, 'localhost', {});
  let prod = new Production();
  prod.proxy();

  // send loads to blue and green VMs
  let start_time = (new Date()).getTime()/1000;
  while(((new Date()).getTime()/1000) - start_time <= 60)
  {
    let response = await got.post("https://api.digitalocean.com/v2/droplets", 
    {
      headers:headers,
      json: data
    }).catch( err => 
      console.error(chalk.red(`createDroplet: ${err}`)) 
    );
  }

  console.log('siege blue');
  // import { execSync } from 'child_process';  // replace ^ if using ES modules
  let cmd = "siege -b -t60s --content-type 'application/json' '"+prod.TARGET+" POST < survey.json'";
  console.log(cmd);
  let output = execSync(cmd, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'inherit', 'inherit'] });

  prod.TARGET = GREEN;

  console.log("prod target changed now :: "+prod.TARGET);
  console.log('siege green');

  cmd = "siege -b -t60s --content-type 'application/json' '"+prod.TARGET+" POST < survey.json'";
  console.log(cmd);
  output = execSync(cmd, { cwd: '/home/vagrant/server/', encoding: 'utf-8', stdio: ['inherit', 'inherit', 'inherit'] });

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
    
}