module.exports = {
            run: function(){
                  return new Promise(function(resolve, reject) {

                        const path = require('path');
                        const fs = require('fs');

                        const directoryPath = 'storm_modules/custom';

                        fs.readdir(directoryPath, function (err, files) {

                            resolve(files);

                        });
                  })
            }
}
