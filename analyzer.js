let YOU_ID;

const demofile = require('demofile');

const player = require('./player');

function analizeDemo(buffer, YOU, callback) {
    const p = new Promise((resolve, reject) => {
        const result = {
            score: [0, 0],
            scoreboard: []
        };
        
        const demoFile = new demofile.DemoFile();
        
        demoFile.on("start", () => {
            result.map = demoFile.header.mapName;
         
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
                }

                //console.log(` > Player entered   ${p.name} (${p.userId})`);
            }
        });

        demoFile.gameEvents.on("round_officially_ended", e => {
            const teams = demoFile.teams;

            const terrorists = teams[2];
            const cts = teams[3];
            const round = terrorists.score + cts.score;

            const entYou = demoFile.entities.getByUserId(YOU_ID);

            if(round == 1) {
                result.team = entYou.teamNumber-2;
                for(let it in result.scoreboard) {
                    const id = result.scoreboard[it].id;
                    const ent = demoFile.entities.getByUserId(id);
                    result.scoreboard[it].team = ent.teamNumber-2 == 0 ? 1 : 0;
                }
            }

            //console.log("Round " + round);

        });

        demoFile.gameEvents.on("player_death", e => {
            if(demoFile.teams[2].score + demoFile.teams[3].score < 1) return;
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
            //console.log(" > Demo ended!");
            resolve(result);
        });

        demoFile.parse(buffer);
    });

    p.then(res => {
        callback(proccessDemoData(res));
    });
}

const proccessDemoData = (demoData) => {
    const sc = [];
    let i = 0;
    for(let it in demoData.scoreboard) {
        sc[i] = demoData.scoreboard[it];
        i++;
    }
    demoData.scoreboard = sc;
    return demoData;
}

module.exports = analizeDemo;