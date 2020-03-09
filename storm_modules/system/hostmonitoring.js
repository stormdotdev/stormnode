module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            nodeOptions: null,
            setNodeOptions: function(nodeOptions){
                                    this.nodeOptions = nodeOptions;
                              },
            run: function(){
                  return new Promise(function(resolve, reject) {

                        //https://github.com/sebhildebrandt/systeminformation
                        const si = require('systeminformation');

                        Promise.all([
                                    si.mem(),
                                    si.currentLoad(),
                                    si.fsSize()
                                    ]).then(values => {

                                          //Memory
                                          var mem = values[0];
                                          var memory = [mem.total, mem.available];

                                          //Cpu
                                          var currentLoad = values[1];
                                          var cpus = [];
                                          var cpu_total = [currentLoad.currentload, currentLoad.currentload_user, currentLoad.currentload_system];
                                          cpus.push(cpu_total);
                                          for (const cpu of currentLoad.cpus) {
                                               cpus.push([cpu.load, cpu.load_user, cpu.load_system]);
                                          }

                                          //Disk
                                          var fsSize = values[2];
                                          var disks = [];
                                          for (const disk of fsSize) {
                                                disks.push([disk.mount, disk.size, disk.used]);
                                          }

                                          const result = {
                                                memory: memory,
                                                cpus: cpus,
                                                disks: disks
                                          }
                                          resolve(result);

                                    });

                  })
            }
}
