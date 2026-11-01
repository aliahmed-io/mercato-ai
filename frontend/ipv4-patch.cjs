const dns = require('dns');
const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = { family: 4 };
  } else if (typeof options === 'object' && options !== null) {
    options = { ...options, family: 4 };
  } else {
    options = { family: 4 };
  }
  return origLookup.call(this, hostname, options, callback);
};
