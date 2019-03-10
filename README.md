# cf-express-server
Standard server for CloudFoundary projects that contain some typical packages for an express server as well as hooking into some IBM Cloud servcies. The main motivation behind this project was to have a mostly out-of-the-box express server for quick PoCs and other projects. It's not a silver bullet but can easily be extended to have other services built in.

The configuration of the server is built on [dotenv](https://github.com/motdotla/dotenv), [yargs](http://yargs.js.org/), and [nconf](https://github.com/indexzero/nconf). There is an easy way to add new options to the server and expose those options, optionally, as environmental variables (which can be stored in a .env file for deployment/development purposes).

## Installation
```sh
$ npm install @papertray3/cf-express-server
```


## Usage
A Typical usage might look like:
```js
var cfserver = require('@papertray3/cf-express-server');
var express = require('express');

var server = cfserver.CreateCFServer({
    cliOptions: {
        newOption : {
            describe : 'A new option that will get added to the common options',
            type: 'string',
            choices : ['first', 'second', 'third'],
            required: true
        }
    }
}, [{
    name: 'Static AddIn',
    disabled : false,
    priority : 900, // runs after all other built in addins but before the 'server' addIn
    getOptions : (curOptions, addins) => null, //could return more options specific to this addIn
    addIn: (server, addins) => {

        //server is an express app, many of the typical middleware services are already added
        const log = server.getLogger('myAddin'); //built in log4js support
        const config = server.getConfig(); //get all configuration variables
        
        server.use(express.static('/'));
    }
}]);

const log = server.getLogger('mainLogger');
const config = server.getConfig();
server.start(() => {
    log.info('Serving on port :', config.get(cfserver.CommonConfigNames.PORT));
});
```

When run without options would result in: 
```
Server Options
  --noHelmet                   Turn off helmet middleware
                               (https://www.npmjs.com/package/helmet)
                               (env:NO_HELMET)                         [boolean]
  --noCloudantStore            Turn off IBM Cloudant Store for sessions
                               (https://www.npmjs.com/package/connect-cloudant-s
                               tore) (env:NO_CLOUDANT_STORE)           [boolean]
  --cloudantStoreUrl           URL for the cludant store (e.g.,
                               https://MYUSERNAME:MYPASSWORD@MYACCOUNT.cloudant.
                               com) (env:CLOUDANT_STORE_URL)            [string]
  --cloudantStoreInstanceName  VCAP Instance Name for cloudant store. For use
                               when deployed on the IBM Cloud (conflicts with
                               cloudantStoreUrl).
                               (env:CLOUDANT_STORE_INSTANCE_NAME)       [string]
  --noSession                  Turn off session middleware
                               (https://www.npmjs.com/package/express-session)
                               (env:NO_SESSION)                        [boolean]

AppID Options
  --noSignOn             Turn off AppID middleware
                         (https://www.npmjs.com/package/ibmcloud-appid)
                         (env:NO_SIGN_ON)                              [boolean]
  --appIdTenantId        Tenant ID for AppID Service. This is unnecessary if
                         deployed to the IBM Cloud with a connection to an AppID
                         instance. (env:APPID_TENANT_ID)                [string]
  --appIdClientId        Client ID for AppID Service. This is unnecessary if
                         deployed to the IBM Cloud with a connection to an AppID
                         instance. (env:APPID_CLIENT_ID)                [string]
  --appIdSecret          Secret Key for AppID Service. This is unnecessary if
                         deployed to the IBM Cloud with a connection to an AppID
                         instance. (env:APPID_SECRET)                   [string]
  --appIdOauthServerUrl  OAUTH Server URL AppID Service. This is unnecessary if
                         deployed to the IBM Cloud with a connection to an AppID
                         instance. (env:APPID_OAUTH_SERVER_URL)         [string]

Security Options
  --protocol     undefined (env:PROTOCOL)    [string] [choices: "http", "https"]
  --noSSL        Turns off SSL even if protocol is https (server will be over
                 http regardless). However, tls will never be used if protocol
                 is http. (env:NO_SSL)                                 [boolean]
  --sslCAFile    Path to the certificate authority chain file (in PEM format,
                 env: SSL_CA_FILE) (env:SSL_CA_FILE)                    [string]
  --sslCertFile  Path to the certificate file (in PEM format, env:
                 SSL_CERT_FILE) (env:SSL_CERT_FILE)                     [string]
  --sslKeyFile   Path to the certificate key file (in PEM format, env:
                 SSL_KEY_FILE) (env:SSL_KEY_FILE)                       [string]

Options:
  --help       Show help                                               [boolean]
  --version    Show version number                                     [boolean]
  --newOption  A new option that will get added to the common options
                       [string] [required] [choices: "first", "second", "third"]
  --logLevel   log4js log level for default console appender. Use
               env:LOG4JS_CONFIG to point to a configuration file
               (https://www.npmjs.com/package/log4js). This option will be
               ignored if a configuration file is used (env:LOG_LEVEL)  [string]

Missing required argument: newOption
```

Currently, there are several builtin middleware AddIns (in priority order) that can optionally be disabled:
 1. [log4js](https://log4js-node.github.io/log4js-node/)
 1. [helmet](https://helmetjs.github.io/) 
 1. [connect-cloudant-store](https://github.com/adriantanasa/connect-cloudant-store)
 1. [express-sessions](https://github.com/expressjs/session)
 1. [ibmcloud-appid](https://github.com/ibm-cloud-security/appid-serversdk-nodejs)(WebAppStrategy)
 1. Creating either an HTTP or HTTPS server with SSL support

 Each builtin AddIn has a given priority (starting at 100) with several "slots" in between each AddIn in order to insert custom AddIns. Each AddIn has the following members and methods:

### name
A human readable name for the AddIn. Some of the builtin AddIns are dependent on eachother. For instance, the appId AddIn requires the `sessionAddIn` to be present and enabled. You could add your own session AddIn replacement with the same name to support a different session storage mechanism without changing the appId AddIn

### priority
Simply a number that orders all the AddIns. Lower numbers are higher priority.

### disabled
By default false, but if set to true the AddIn is completely disabled. Any options for the AddIn will not be available. In order to disable an addIn, the disable member must be set to true before creating the server (in order to keep out the command line options for that AddIn) or at the very least the CFExpressServer::start method is called. 

### getOptions(currentOptions : CliOptions, addIns : AddIn[]) : CliOptions | null
Before the express server is created and before the options are parsed, each AddIn will get a chance to provide it's own command line options. The current options up to that point (all higher priority AddIns) will be provided so that options can either be changed or checked. The returned options will be added to the applications options.

Every AddIn will be provided as the addIns array for dependency checking or manipulation. 

### addIn(server : CFExpressServer, addIns : AddIn[])
This method is called for each enabled AddIn during server creation. 

## AddIn Options and Configuration
Command line options can be provided for each AddIn, as well as global options in the CreateCFServer function. The option object is the [yargs option object](https://github.com/yargs/yargs/blob/HEAD/docs/api.md#optionkey-opt) with the addition of an optional `env` field. The `evn` field allows you to specify an environment variable that will be used for the option. 

Some of the builtin AddIns have a method for configuring the AddIn before being added in (for instance the session store has a configure method `configure(options: SessionOptions): void` that should be called before the creation of the CFExpressServer).

## Server Usage
The CFExpressServer is simply an express server with the following methods attached:

### getConfig() : Config
This method returns the [nconf](https://github.com/indexzero/nconf) object that contains the runtime configuration and command line option settings.

### getLogger(name? : string) : Logger
Gets the configured [log4js](https://log4js-node.github.io/log4js-node/) logger. You can configure the log4js builtin AddIn programmatically or via the LOG4JS_CONFIG environment variable. 

### start(listener? : Function) : void
A convenience function for starting the server (akin to `server.listen()`). If the `serverAddIn` is used, this method will create either an HTTP or HTTPS server based on command line options. 