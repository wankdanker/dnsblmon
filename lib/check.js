var dnsbl = require('dnsbl');
var clone = require('clone');
var debug = require('debug')('dnsblmon:check');
var list = require('./list');

module.exports = factory;

function factory (settings) {
  settings = settings || {
    timeout: 10000
    , server: "8.8.8.8"
    , port: 53
  };

  return function check (ip, bl, cb) {
    if (typeof bl === 'function') {
      cb = bl;
      bl = null;
    }

    if (!Array.isArray(ip)) {
      ip = [ip];
    }

    debug('checking ip: %s', ip);

    var which = list.list;

    if (bl) {
      debug('checking specific blacklist: %s', bl);

      //we just want to check one specific black list.
      //TODO: allow a specific array, but validate them all against our list
      if (!list.index[bl]) {
        return cb (new Error('Invalid blacklist: ' + bl));
      }

      which = [bl];
    }

    dnsbl.batch(ip, which, settings).then(function (result) {
      debug('got %s results', result.length);

      var ret = [];
      var hostIndex = {};

      result.forEach(function (res) {
        var host = hostIndex[res.address] = hostIndex[res.address] || [];
        var bl = clone(list.index[res.blacklist]);

        bl.listed = res.listed;

        host.push(bl);
      });

      Object.keys(hostIndex).forEach(function (host) {
        ret.push({
          host : host
          , blacklists : hostIndex[host]
        });
      });

      return cb(null, ret);
    }).catch(function (err) {
      debug('error while checking %s', err.message);

      return cb(err);
    });
  }
}
