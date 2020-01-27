module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                              const VERSION = require(__dirname + '/../../package.json').version;
                              return VERSION;
                  }

}
