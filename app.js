const fs = require('fs');
const path = require('path');
const analizeDemo = require('./analyzer');

const YOU = 'STEAM_1:1:64239242';

const demoFilesPath = "C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/csgo/replays";

fs.readdir(demoFilesPath, (err, files) => {
    const origin = files.filter(x => {
        if(x.endsWith('.dem')) return true;
        return false;
    });
    const done = files.filter(x => {
        if(x.endsWith('.dem.json')) return true;
        return false;
    });
    const notDone = [];
    for(let i in origin) {
        let found = false;
        for(j in done) {
            if(origin[i].split(".")[0] == done[j].split(".")[0]) {
                found = true;
                break;
            } 
        }
        if(!found) notDone.push(origin[i]);
    }
    console.log(notDone);
    for(let i in notDone) {
        console.log("Analyzing " + notDone[i]);
        const stats = fs.statSync(path.join(demoFilesPath, notDone[i]));
        fs.readFile(path.join(demoFilesPath, notDone[i]), (err, buffer) => {
            analizeDemo(buffer, YOU, res => {
                res.date = stats.mtime;
                const str = JSON.stringify(res, null, 2);
                fs.writeFileSync(path.join(demoFilesPath, notDone[i] + ".json"), str);
            }); 
        });
        fs.unlinkSync(path.join(demoFilesPath, notDone[i]));
        fs.unlinkSync(path.join(demoFilesPath, notDone[i] + ".info"));
    }
});

