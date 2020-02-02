module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                  return new Promise(function(resolve, reject) {

                              const { exec } = require('child_process');
                              exec("free -m | awk '/^Mem/ {printf(\"%u|%u|%u\", $2, $3, $4);}'", (err, stdout, stderr) => {
                                if (err) {
                                  //some err occurred
                                  reject(err);
                                } else {
                                      var stdout_array = stdout.split("|");
                                      const result = {
                                            total: stdout_array[0],
                                            used: stdout_array[1],
                                            free: stdout_array[2],
                                      }
                                      resolve(result);
                                }
                              });

                        })
                  }
}
