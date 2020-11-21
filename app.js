const YOU = 'STEAM_1:1:64239242';
let YOU_ID;

const fs = require('fs');
const demofile = require('demofile');

const player = require('./player');

const filename = "test3";

fs.readFile(filename + ".dem", (err, buffer) => {
    analizeDemo(buffer, res => {
        const str = JSON.stringify(res, null, 2);
        console.log(res);
        fs.writeFileSync(filename + ".dem.json", str);
    }); 
});

function analizeDemo(buffer, callback) {
    const p = new Promise((resolve, reject) => {
        const result = {
            score: [0, 0],
            scoreboard: []
        };
        
        const demoFile = new demofile.DemoFile();
        
        demoFile.on("start", () => {
            console.log(" > Map: " + demoFile.header.mapName);
            result.map = demoFile.header.mapName;
            result.tickRate = "Tick rate:", demoFile.header.tickRate;
         
            // Stop parsing - we're finished
            demoFile.cancel();
        });
        
        demoFile.entities.on("create", e => {
            // We're only interested in player entities being created.
            if (!(e.entity instanceof demofile.Player)) {
              return;
            }
            const p = e.entity;

            const sid = p.steamId;

            if(sid == "BOT") return;
            if(!result.scoreboard[sid]) {
                result.scoreboard[sid] = JSON.parse(JSON.stringify(player));
                result.scoreboard[sid].name = p.name;
                result.scoreboard[sid].steamId = p.steamId;
                result.scoreboard[sid].id = p.userId;

                
                if(sid == YOU) {
                    YOU_ID = p.userId;
                    console.log(p);
                }

                console.log(` > Player entered   ${p.name} (${p.userId})`);
            }
        });

        demoFile.gameEvents.on("round_officially_ended", e => {
            const teams = demoFile.teams;

            const terrorists = teams[2];
            const cts = teams[3];
            const round = terrorists.score + cts.score;

            const entYou = demoFile.entities.getByUserId(YOU_ID);

            if(round > 15) {
                result.team = entYou.teamNumber-2;
            }

            console.log("Round " + round);

        });

        demoFile.gameEvents.on("player_death", e => {
            const victim = demoFile.entities.getByUserId(e.userid);
            const attacker = demoFile.entities.getByUserId(e.attacker);
            if(victim.steamId != "BOT") 
                result.scoreboard[victim.steamId].deaths++;

            if(attacker.steamId != "BOT") {            
                result.scoreboard[attacker.steamId].kills++;
                result.scoreboard[attacker.steamId].hs += e.headshot;
            }

            //console.log(`${attackerName} [${e.weapon}] ---${headshotText}---> ${victimName}`);
        });

        demoFile.on("end", e => {
            const teams = demoFile.teams;
            
            const entYou = demoFile.entities.getByUserId(YOU_ID);

            const terrorists = teams[2];
            const cts = teams[3];
            
            result.score[0] = terrorists.score;
            result.score[1] = cts.score;
            console.log(" > Demo ended!");
            resolve(result);
        });

        demoFile.parse(buffer);
    });

    p.then(res => {
        callback(res);
    });
}
