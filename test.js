var x = require('./lib/index');
var s = require('./lib/addins/sessions');
var c = require('./lib/addins/cloudant-store');
var a = require('./lib/addins/appid-webstrategy');
var express = require('express');


c.cloudantStoreAddIn.configure({secret: 'random stuff',        resave: false,
saveUninitialized: true});
a.appIdAddIn.configure('http://localhost:8080' + a.defaultAppIdUris.callback);

var y = x.CreateCFServer({
    loggerName: 'testServer'
}, [{
    name: 'test',
    disabled: false,
    priority: 900,
    getOptions: (cur) => null,
    addIn: (server) => {
        const log = server.getLogger('MyStuff');
        log.info('Setting up root dir');
        server.use(express.static('./'));
    }
}]);
const config = y.getConfig();

var logger = y.getLogger('main');

/* y.start(() => {
    logger.info('Started: ', y.getConfig().get('url'));
}); */

y.listen(8080, () => {
    console.log('started');
})

function redirectUri(config) {
    return config.get('url') + a.defaultAppIdUris.callback;
}