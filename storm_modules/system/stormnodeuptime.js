module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                        return new Promise(function(resolve, reject) {

                                    const UPTIME = process.uptime();
                                    resolve(UPTIME);

                        })
                  }
}
