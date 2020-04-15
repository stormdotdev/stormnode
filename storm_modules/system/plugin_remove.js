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


                      var fs = require('fs');
                      var deleteFolderRecursive = function(path) {
                        if( fs.existsSync(path) ) {
                          fs.readdirSync(path).forEach(function(file,index){
                            var curPath = path + "/" + file;
                            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                              deleteFolderRecursive(curPath);
                            } else { // delete file
                              fs.unlinkSync(curPath);
                            }
                          });
                          fs.rmdirSync(path);
                        }
                      };
                      var commands_json = JSON.parse(commands);
                      deleteFolderRecursive('./storm_modules/custom/'+commands_json.plugin_to_be_removed);

                    })
                  }
                  else return('plugin installation is not allowed');


            }
}
