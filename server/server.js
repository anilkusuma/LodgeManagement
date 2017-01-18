'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var customLib = require('./customlib.js');
var multer = require('multer');
var path = require('path');
var https = require('https');
var fs = require('fs-extra');
var app = module.exports = loopback();
var bodyParser = require('body-parser');

app.use(bodyParser.json({limit:1000000000})); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true,limit:1000000000 }));

app.start = function() {
    return app.listen(function() {
        app.emit('started');
        console.log('Application Started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
        }
    });
};

boot(app, __dirname, function(err) {
    if(err)
        throw err;
    if (require.main === module)
        app.start();
});
