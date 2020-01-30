module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                              const UPTIME = process.uptime();
                              return UPTIME;
                  }
}
