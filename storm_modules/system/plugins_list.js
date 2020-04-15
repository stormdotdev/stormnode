module.exports = {
            run: function(){
                  return new Promise(function(resolve, reject) {

                        const { readdirSync } = require('fs')

                        const getDirectories = source =>
                          readdirSync(source, { withFileTypes: true })
                            .filter(dirent => dirent.isDirectory())
                            .map(dirent => dirent.name);


                        const directoryPath = 'storm_modules/custom';
                        resolve(getDirectories(directoryPath));



                  })
            }
}
