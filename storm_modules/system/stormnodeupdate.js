module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            nodeOptions: null,
            setNodeOptions: function(nodeOptions){
                                    this.nodeOptions = nodeOptions;
                              },
            run: function(){

                  if (this.nodeOptions.allow_remote_update!=1) return('Remote update is not allowed');

                  return new Promise(function(resolve, reject) {
                        var string_return = "";
                        var cp = require('child_process'),
                            spawn = cp.spawn;
                        var child;

                        child = spawn('git', ['pull']);
                        child.stdout.on('data', function (data) {
                              var str = data.toString()
                              string_return += str;
                        });

                        child2 = spawn('npm', ['install']).on('close', function() {
					resolve(string_return);
					setTimeout(function(){
                                                return process.exit('reboot');
                                          },5000);
                            });

                        child2.stdout.on('data', function (data) {
                              var str = data.toString();
                              string_return += str;
                        });

                  })
            }
}
