var UseyHttp = require('usey-http');
var debug = require('debug')('dnsblmon:server');
var check = require('./lib/check')({ server : '8.8.8.8' });

var app = UseyHttp();
var port = process.env.PORT || 5560;

app.get('/check/:ip', checker);
app.get('/check/:ip/:blacklist', checker);

app.use(UseyHttp._404({ message : 'could not find the thing that you seek.' }));

app.use('error', function (err, req, res) {
  debug('error', err);

  res.statusCode = 500;

  var result = {
    error : {
      message : err.message
      , stack : err.stack
    }
  };

  res.setHeader('content-type', 'application/json');

  res.end(JSON.stringify(result));
});

app.listen(port);

console.log('listening on %s', port);

function checker (req, res, next) {
  check(req.params.ip, req.params.blacklist, function (err, data) {
    if (err) {
      return next(err);
    }

    var result = {
      result : data[0]
      , counts : {
        listed : data[0].blacklists.reduce(function (y, a) { return y + (a.listed ? 1 : 0)}, 0)
        , unlisted : data[0].blacklists.reduce(function (y, a) { return y + (!a.listed ? 1 : 0)}, 0)
      }
    };

    res.setHeader('content-type', 'application/json');

    res.end(JSON.stringify(result));
  });
}
