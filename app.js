const fs = require('fs');
const demofile = require('demofile');

const player = require('./player');

fs.readFile("test.dem", (err, buffer) => {
    analizeDemo(buffer, res => {
        console.log(match);
    }); 
});

function analizeDemo(buffer, callback) {
    const p = new Promise((success, error) => {
        const result = {
            scoreboard: []
        };
        
        const demoFile = new demofile.DemoFile();
    
        demoFile.on("end", e => {
            console.log(e);
        });
       
        demoFile.stringTables.on("update", e => {
          if (e.table.name === "userinfo" && e.userData != null) {
            if(!e.userData.fakePlayer) return;
            console.log("\nPlayer name: " + e.userData.name);
            if(!result.scoreboard[""+e.userData.friendsId]) {
                const id = ""+e.userData.friendsId;
                console.log(player.json());
                result.scoreboard[id] = JSON.parse(player.json());
                result.scoreboard[id].xuid = e.userData.xuid;
                result.scoreboard[id].name = e.userData.name;
                result.scoreboard[id].friendsId = e.userData.friendsId;
                result.scoreboard[id].guid = e.userData.guid;
            }
            
          }
        });
    
        demoFile.gameEvents.on("round_officially_ended", e => {
            const teams = demoFile.teams;
        
            const terrorists = teams[2];
            const cts = teams[3];
        
            console.log(
              "\tTerrorists: %s score %d\n\tCTs: %s score %d",
              terrorists.clanName,
              terrorists.score,
              cts.clanName,
              cts.score
            );
        });
        
        demoFile.gameEvents.on("player_death", e => {
            const victim = demoFile.entities.getByUserId(e.userid);
            const victimName = victim ? victim.name : "unnamed";
         
            // Attacker may have disconnected so be aware.
            // e.g. attacker could have thrown a grenade, disconnected, then that grenade
            // killed another player.
            const attacker = demoFile.entities.getByUserId(e.attacker);
            const attackerName = attacker ? attacker.name : "unnamed";
         
            const headshotText = e.headshot ? "0" : "";
         
            console.log(`${attackerName} [${e.weapon}] ---${headshotText}---> ${victimName}`);
          });

          demoFile.on("end", e => {
            success(result);
          });
    
        demoFile.parse(buffer);
    });

    p.then(res => {
        callback(res);
    });
}
