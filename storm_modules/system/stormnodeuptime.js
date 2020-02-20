module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            nodeOptions: null,
            setNodeOptions: function(nodeOptions){
                                    this.nodeOptions = nodeOptions;
                              },
            run: function(){
                        return new Promise(function(resolve, reject) {

                                    const UPTIME = process.uptime();
                                    resolve(UPTIME);

                        })
                  }
}
