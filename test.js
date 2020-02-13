#!/usr/bin/env node
'use strict';


async function execute(){

            const m = require('./storm_modules/system/stormnodeupdate');
            const module_return = await m.run();
            const result = {
                  return: module_return
            };
            console.log(JSON.stringify(result));

}

execute();
