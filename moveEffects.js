//here are relevant variables and functions to aid the effect coding effort:
//
//crit chance -> critChance
//weather -> weather
//damage -> damage 
//f -> applyStatus(target, statusName, sleepTurns, ignore)
//f -> heal(healthPercent, userObject)
//f -> lifeSteal(lifeStealPercent, userObject)
//f -> recoil(recoilPercent, userObject)
//f -> calculateDamage(move, userObject, targetObject)
//f -> calculateDamageMultipliers(move, userObject, targetObject)

const moveEffectObject = {
    ["rest"]:(move, user, enemy) => { //done
        applyStatus(user, "sleep", 2, true)
        heal(100, user)
    },
    ["calm-mind"]: (move, user, enemy) => { //done
        //no effect
    },
    ["psychic"]: (move, user, enemy) => { //done
        //no effect
    },
    ["psyshock"]: (move, user, enemy) => { //done
        //Inflicts damage based on the target's Defense, not Special Defense.
        const attack = user.stats["special-attack"] * stageMultiplier(user["stat-stages"]["attack"])
        const defense = enemy.stats["defense"] * stageMultiplier(enemy["stat-stages"]["defense"])
        damage = (((2*user.level/5 + 2) * move.power * attack/defense)/50 + 2) //base damage
        damage *= calculateDamageMultipliers(move, user, enemy)
    },
    ["recover"]: (move, user, enemy) => { //done
        //"Heals the user by half its max HP."
        heal(50, user)
    },
    ["iron-defense"]: (move, user, enemy) => { //done
        //no effect
    },
    ["hydro-pump"]: (move, user, enemy) => { //done
        //no effect
    },
    ["rain-dance"]: (move, user, enemy) => { //done
        textEvent.push("It started to rain")
        weather = {name:"rain", turns:5}
    },
    ["aqua-tail"]: (move, user, enemy) => { //done
        //no effect
    },
    ["flare-blitz"]: (move, user, enemy) => { //done
        //User takes 1/3 the damage inflicted in recoil. Has a $effect_chance% chance to burn the target.
        recoil(100/3, user)
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "burn")
        //thaw effect already accounted for in the statusEffect 
    },
    ["inferno"]: (move, user, enemy) => { //done
        //Inflicts regular damage. Has a $effect_chance% chance to burn the target.
        applyStatus(enemy, "burn")
    },
    ["dragon-breath"]: (move, user, enemy) => { //done
        //Has a $effect_chance% chance to paralyze the target
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "paralysis")
    },
    ["scary-face"]: (move, user, enemy) => { //done
        //no effect
    },
    ["hypnosis"]: (move, user, enemy) => { //done
        //Puts the target to sleep.
        applyStatus(enemy, "sleep")
    },
    ["dream-eater"]: (move, user, enemy) => { //done
        //Only works on sleeping Pokémon. Drains half the damage inflicted to heal the user.
        if (enemy.status.name === "sleep") {
            lifeSteal(50, user)
        }
        else {
            damage = 0
            textEvent.push("Move failed because target was not asleep")
        }
    },
    ["shadow-ball"]: (move, user, enemy) => { //done
        //no effect
    },
    ["sludge-bomb"]: (move, user, enemy) => { //done
        //Has a $effect_chance% chance to poison the target
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "poison")
    },
    ["curse"]: (move, user, enemy) => { //done
        //
        user.hp -= Math.ceil(user.stats.hp / 2)
        enemy.condition = {name:"curse"}
        textEvent.push(`${user.name} cursed ${enemy.name}`)
    },
    ["dark-pulse"]: (move, user, enemy) => { //done
        //Has a $effect_chance% chance to make the target flinch.
        if (user.turnOrder === "first" && Math.random() < move.effect_chance/100) {
            enemy.skipTurn = "true"
            textEvent.push(`${enemy.name} flinched`)
        }
    },
    ["dragon-dance"]: (move, user, enemy) => { //done
        //no effect
    },
    ["thrash"]: (move, user, enemy) => { //done
        //Hits every turn for 2-3 turns, then confuses the user.
        if (!user.forcedMove.length){
            //adding one extra forced turn so im able to check when I only have one 
            //forced turn left and then trigger an event to stop and cause confusion
            const forcedTimes = Math.floor(Math.random() * 2) + 2 
            for (let i = 0; i < forcedTimes; i++){
                user.forcedMove.push(move)
            }
        }
        else if (user.forcedMove.length === 1) {
            const confuseTurns = Math.floor(Math.random() * 4) + 2  
            user.forcedMove.shift()
            if (!user.condition.name){
                user.condition = {name:"confuse", turns:confuseTurns}
                textEvent.push(`${user.name} became confused`)
            }
        }
    },
    ["crunch"]: (move, user, enemy) => { //done
        //no effect
    },
    ["double-edge"]: (move, user, enemy) => { //done
        //User receives 1/3 the damage inflicted in recoil.
        recoil(100/3, user)
    },
    ["cross-chop"]: (move, user, enemy) => { //done-ish
        //Has an increased chance for a critical hit.
        //gonna recalculate damage to account for crit, --corner case bug, it might say i crit twice
        critChance = 1/8
        damage = calculateDamage(move, user, enemy)
        damage *= calculateDamageMultipliers(move, user, enemy)
    },
    ["bulk-up"]: (move, user, enemy) => { //done
        //no effect
    },
    ["revenge"]: (move, user, enemy) => { //not done but done for now
        //Inflicts double damage if the user takes damage before attacking this turn.
        //gonna intentionally change the effect of this move because the original effect is too much of a pain to code
        if (enemy.decision.move.damageClass != "status" && enemy.turnOrder === "first") {
            damage *= 2
        }

    },
    ["belly-drum"]: (move, user, enemy) => { //done
        //User pays half its max HP to max out its Attack. 
        if (user.hp * 2 <= user.stats.hp) textEvent.push("Not enough health")
        else {
            user.hp -= Math.floor(user.stats.hp/2) 
            user["stat-stages"].attack = 6
            textEvent.push(`${user.name} maximized it's attack`)
        }
        
    },
    ["body-slam"]: (move, user, enemy) => { //done
        //Has a $effect_chance% chance to paralyze the target.
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "paralysis")
    },
    ["hammer-arm"]: (move, user, enemy) => { //done
        //no effect
    },
    ["solar-beam"]: (move, user, enemy) => { //do later , its 12:33am
        if (weather.name){
            if (weather.name === "harsh sunlight") return
            else {
                damage *= 0.5
            }
        } else if (!user.forcedMove.length) {
            textEvent.push("Gathering sunlight")
            user.forcedMove.push(move)
            user.forcedMove.push(move)
            damage = 0
        } else {
            user.forcedMove.shift()
        }
        //if none of these conditions where met then just use the move
    },
    ["synthesis"]: (move, user, enemy) => { //half done
        //Heals the user by half its max HP. Affected by weather.
        if (weather.name){
            if (weather.name === "harsh sunlight") heal(200/3, user)
            else heal(25, user)
        } else heal(50, user)
    },
    ["seed-bomb"]: (move, user, enemy) => { //done
        //no effect
    },
    ["sleep-powder"]: (move, user, enemy) => { //done
        //Puts the target to sleep.
        applyStatus(enemy, "sleep")
    },
    ["hail"]: (move, user, enemy) => {  //done
        weather = {name:"hail", turns:5}

    },
    ["blizzard"]: (move, user, enemy) => { //technically half done
        //Has a $effect_chance% chance to freeze the target.
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "freeze")
    },
    ["brine"]: (move, user, enemy) => { //done
        //Has double power against Pokémon that have less than half their max HP remaining.
        if (enemy.hp * 2 < enemy.stats.hp)
        damage *= 2
        
    },
    ["sunny-day"]: (move, user, enemy) => {  //done
        weather = {name:"harsh sunlight", turns:5}
        textEvent.push("the sun shines brighter")
    },
    ["discharge"]: (move, user, enemy) => { //done
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "paralysis")

    },
    ["thunder"]: (move, user, enemy) => { //done
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "paralysis")

    },
    ["swagger"]: (move, user, enemy) => { //done
        const confuseTurns = Math.floor(Math.random() * 4) + 2  
        enemy.condition = {name:"confuse", turns:confuseTurns}
        textEvent.push(`${enemy.name} became confused`)
    },
    ["thunder-wave"]: (move, user, enemy) => { //done
        applyStatus(enemy, "paralysis")
    },
    ["supersonic"]: (move, user, enemy) => { //done
        const confuseTurns = Math.floor(Math.random() * 4) + 2  
        enemy.condition = {name:"confuse", turns: confuseTurns}
        textEvent.push(`${enemy.name} became confused`)
    },
    ["toxic"]: (move, user, enemy) => { //done
        applyStatus(enemy, "badlyPoison")
    },
    ["air-slash"]: (move, user, enemy) => { //done
        if (user.turnOrder === "first" && Math.random() < move.effect_chance/100) {
            enemy.skipTurn = "true"
            textEvent.push(`${enemy.name} flinched`)
        }
    },
    ["venoshock"]: (move, user, enemy) => { //done
        if (enemy.status.name === "poison" || enemy.status.name === "badlyPoison") {
            damage *= 2
        }
    },
    ["x-scissor"]: (move, user, enemy) => { //done
        //no extra effect
    },
    ["swords-dance"]: (move, user, enemy) => { //done
        //no extra effect
    },
    ["iron-head"]: (move, user, enemy) => { //done
        if (user.turnOrder === "first" && Math.random() < move.effect_chance/100) {
            enemy.skipTurn = "true"
            textEvent.push(`${enemy.name} flinched`)
        }
    },
    ["sucker-punch"]: (move, user, enemy) => { 
        console.log(enemy.decision.move.damageClass)
        if (enemy.decision.move.damageClass === "status") {
            textEvent.push(`${move.name} failed`)
            damage = 0
        }

    },
    ["payback"]: (move, user, enemy) => { 
        if (enemy.decision.move.damageClass != "status" && enemy.turnOrder === "first") {
            damage *= 2
        }
    },
    ["quick-attack"]: (move, user, enemy) => { 
        //no extra effect
    },
    ["dragon-claw"]: (move, user, enemy) => { 
        //no extra effect
    },
    ["aerial-ace"]: (move, user, enemy) => { 
        //cannot miss
    },
    ["flamethrower"]: (move, user, enemy) => { 
        if (Math.random() < move.effect_chance/100) applyStatus(enemy, "burn")
    },
    ["outrage"]: (move, user, enemy) => { 
        //Hits every turn for 2-3 turns, then confuses the user.
        if (!user.forcedMove.length){
            //adding one extra forced turn so im able to check when I only have one 
            //forced turn left and then trigger an event to stop and cause confusion
            const forcedTimes = Math.floor(Math.random() * 2) + 2 
            for (let i = 0; i < forcedTimes; i++){
                user.forcedMove.push(move)
            }
        }
        else if (user.forcedMove.length === 1) {
            const confuseTurns = Math.floor(Math.random() * 4) + 2  
            user.forcedMove.shift()
            if (!user.condition.name){
                user.condition = {name:"confuse", turns:confuseTurns}
                textEvent.push(`${user.name} became confused`)
            }
        }
    },
    

}