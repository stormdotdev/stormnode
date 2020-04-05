module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            nodeOptions: null,
            arguments: null,
            setNodeOptions: function(nodeOptions){
                                    this.nodeOptions = nodeOptions;
                              },
            setArguments: function(arguments){
                                    this.arguments = arguments;
                              },
            run: function(){
                  var commands = this.arguments;
                  if (this.nodeOptions.allow_remote_plugins_installation!=0){
                    return new Promise(function(resolve, reject) {

                          var string_return = "";
                          const { exec } = require('child_process');


                          var exec_commands = (commands) => {
                            var command = commands.shift()
                            exec(command.command, {cwd: command.path}, (error, stdout, stderr) => {

                              if(stdout) string_return += stdout;
                              if(stderr) string_return += stderr;

                              if(commands.length) exec_commands(commands)
                              else resolve(string_return);
                            });
                          }

                          exec_commands(commands)


                    })
                  }
                  else return('plugin installation is not allowed');


            }
}
