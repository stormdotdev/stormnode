module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                  return new Promise(function(resolve, reject) {
                        var string_return = "";
                        var cp = require('child_process'),
                            spawn = cp.spawn;
                        var child;

                        child = spawn('git', ['pull']);
                        child.stdout.on('data', function (data) {
                              var str = data.toString()
                              console.log(str);
                              string_return += str;
                        });

                        child2 = spawn('npm', ['install']).on('close', function() {
                                    setTimeout(function(){
                                                return process.exit('reboot');
                                          },3000);

                            });

                        child2.stdout.on('data', function (data) {
                              var str = data.toString();
                              string_return += str;
                              resolve(string_return);
                              console.log(str);
                        });

                  })
            }
}
