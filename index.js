//global variables
let damageRelation = {}
let pokemonInfo = {}
const textEvent = []
let moves
let userPokemon
let computerPokemon
let weather = {name:"", turns:0}
let critChance = 1/24
let damage

const pokemonList = [ 
    {venusaur: ["solar-beam", "synthesis", "seed-bomb", "sunny-day"],        img: "./assets/venusaur.jpg"},
    {charizard:["flare-blitz", "inferno", "dragon-breath", "scary-face"],    img: "./assets/charizard.jpg"},
    {blastoise:["iron-defense", "hydro-pump", "rain-dance", "aqua-tail"],    img: "./assets/blastoise.jpg"}, 
    {alakazam: ["calm-mind", "psychic", "psyshock", "recover"],              img:"./assets/alakazam.jpg"},
    {gengar:   ["shadow-ball", "sludge-bomb", "curse", "dark-pulse"],        img: "./assets/gengar.jpg"},
    {gyarados: ["dragon-dance", "thrash", "aqua-tail", "crunch"],            img: "./assets/gyarados.jpg"},
    {machamp:  ["double-edge", "cross-chop", "bulk-up", "revenge"],          img: "./assets/machamp.jpg"},
    {snorlax:  ["rest", "belly-drum", "body-slam", "hammer-arm"],            img: "./assets/snorlax.jpg"},
    {walrein:  ["hail", "blizzard", "brine", "rest"],                        img: "./assets/walrein.jpg"},
    {jolteon:  ["discharge", "thunder", "swagger", "thunder-wave"],          img: "./assets/jolteon.jpg"},
    {gardevoir:["calm-mind", "hypnosis", "dream-eater", "psychic"],          img: "./assets/gardevoir.jpg"},
    {crobat:   ["supersonic", "toxic", "air-slash", "venoshock"],            img: "./assets/crobat.jpg"},
    {scizor:   ["iron-defense", "x-scissor", "swords-dance", "iron-head"],   img: "./assets/scizor.png"},
    {absol:    ["sucker-punch", "payback", "swords-dance", "quick-attack"],  img: "./assets/absol.jpg"},
    {salamence:["dragon-claw", "aerial-ace", "outrage", "flamethrower"],     img: "./assets/salamence.jpg"},
]


const statCalculator = (base, IV, EV, level, stat) => {
    if (stat === "hp") {
        return Math.round((((2*base+IV+EV/4)*level)/100) + level + 10)
    }
    else {
        return Math.round(((2*base+IV+EV/4)*level)/100 + 5)
    }
}

const initializeMoves = (moveList) => {
    const allowedMoves = {}
    moveList.forEach(move => {
        fetch(`https://pokeapi.co/api/v2/move/${move}`).then(res => res.json())
        .then(returnedMove => {
            const name = returnedMove.name
            allowedMoves[name] = {
                name:name,
                power:returnedMove.power,
                pp:returnedMove.pp,
                priority:returnedMove.priority,
                id:returnedMove.id,
                damageClass:returnedMove.damage_class.name,
                accuracy:returnedMove.accuracy,
                type:returnedMove.type.name,
                statChanges: [],
                effectChance: returnedMove.effect_chance,
                effect: returnedMove.effect_entries[0].short_effect,
                target: returnedMove.target.name
            }

            returnedMove["stat_changes"].forEach(change => {
                allowedMoves[name].statChanges.push({
                    target: returnedMove.target.name,
                    stat: change.stat.name,
                    stages: change.change,
                })
            })
        })
    })
    return allowedMoves
}

const getTypeRelation = (damageTo, multiplier, fetchedObject, startObject) => {
    //stores damageTo value from api in the startObject
    return fetchedObject.damage_relations[damageTo].reduce((relationObject, type) => {
        relationObject[type.name] = multiplier
        return relationObject
    },startObject)
}

function getDamageRelation() {
    for (let i = 1; i < 19; i++) {//grabbing one of each 18 types
        fetch(`https://pokeapi.co/api/v2/type/` + i)
        .then(res => res.json())
        .then(typeObject => {
            let typeRelation = getTypeRelation("double_damage_to", 2, typeObject, {})
            typeRelation = getTypeRelation("half_damage_to", 0.5, typeObject, typeRelation)
            typeRelation = getTypeRelation("no_damage_to", 0, typeObject, typeRelation)
            damageRelation[typeObject.name] = typeRelation
        })
    }
}

const createPokemonObject = (name, level, moves, sourceIMG) => {
    const EV = 85
    const IV = 31
    const pokemonObject = {name:name, level:level, stats:{}}
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(res => res.json())
    .then(pokemon => {
        pokemon.stats.forEach(value => {
            pokemonObject.stats[value.stat.name] = statCalculator(value.base_stat, IV, EV, level, value.stat.name)
        })
        pokemonObject["hp"] = pokemonObject.stats["hp"]
        pokemonObject["type"] = pokemon.types.map(type => type.type.name)
        
        //adding stat stages
        pokemonObject["stat-stages"] = {}
        pokemonObject["stat-stages"]["attack"] = 0
        pokemonObject["stat-stages"]["defense"] = 0
        pokemonObject["stat-stages"]["special-attack"] = 0
        pokemonObject["stat-stages"]["special-defense"] = 0
        pokemonObject["stat-stages"]["speed"] = 0

        //adding Moves
        pokemonObject["moves"] = initializeMoves(moves)

        //adding More Stats
        pokemonObject["IV"] = IV
        pokemonObject["EV"] = EV
        pokemonObject["img"] = sourceIMG
        pokemonObject["status"] = {}
        pokemonObject["condition"] = {}
        pokemonObject["forcedMove"] = []
        
    })  
    return pokemonObject
}

const typeEfficiency = (move, receiverTypes) => {
    let multiplier = 1
    receiverTypes.forEach(type => {
    let multi = damageRelation[move][type]
    if (multi === undefined) multi = 1
    multiplier *= multi
    }) 
    if (multiplier > 1) textEvent.push("It's super effective")
    else if (multiplier === 0) textEvent.push("Not effective at all")
    else if (multiplier < 1) textEvent.push("It's not very effective")
    return multiplier
}

//if Ignore is set to true it will overwrite current status effect (only effects like rest sets this effect to true)
const applyStatus = (targetObject, statusName, turns, ignore = false) => { 
    if (!targetObject.status["name"] || ignore) {
        targetObject.status["name"] = statusName
        if (statusName === "sleep"){
            if (!turns) turns = (Math.ceil(Math.random() * 4) + 1) //if turns is omitted then randomly assign 2-5 turns
            else targetObject.status["turns"] = turns
        } else if (statusName === "badlyPoison") {
            targetObject.status["stacks"] = 1
        }
    } else textEvent.push(`applying ${statusName} failed`)
}

const heal = (healthPercent, userObject) => {
    if (userObject.hp !== userObject.stats.hp) {
        userObject.hp += Math.ceil(userObject.stats.hp * healthPercent/100)
        if (userObject.hp > userObject.stats.hp) {
            userObject.hp = userObject.stats.hp
            textEvent.push(`${userObject.name} fully restored their HP`)
        } else {
            textEvent.push(`${userObject.name} restored some HP`)
        }
    } else textEvent.push(`${userObject.name} is already at max HP`)
}

const lifeSteal = (lifeStealPercent, userObject) => {
    if (userObject.hp !== userObject.stats.hp) {
        userObject.hp += Math.ceil(damage * lifeStealPercent/100) //damage received from global variable
        if (userObject.hp > userObject.stats.hp) {
            userObject.hp = userObject.stats.hp
        }
        textEvent.push(`${userObject.name} restored some HP`)
    }
}

const recoil = (recoilPercent, userObject) => {
    userObject.hp -= Math.ceil(damage * recoilPercent/100)
}

const weatherMultiplier = (moveType, weatherName) => {
    let weatherMultiplier = 1
    if (weatherName) return weatherMultiplier
    if (weather === "harsh sunlight" && moveType === "fire") weatherMultiplier  = 1.5
    if (weather === "harsh sunlight" && moveType === "water") weatherMultiplier = 1/1.5
    if (weather === "rain"           && moveType === "water") weatherMultiplier = 1.5
    if (weather === "rain"           && moveType === "fire") weatherMultiplier  = 1/1.5
    return weatherMultiplier
} 

const stageMultiplier = stage => { //calculates the stat multiplier based on your stat stage
    return (stage >= 0 ? 1+0.5*stage : 1/(1+0.5*Math.abs(stage))) 
}

const calculateDamage = (move, userObject, targetObject) => {
    const damageType = damageClass => damageClass === "special" ? "special-" : "" //quick check to see if we should use special attack and special defense
    const attack = userObject.stats[damageType(move.damageClass) + "attack"] * stageMultiplier(userObject["stat-stages"][damageType(move.damageClass) + "attack"])
    const defense = targetObject.stats[damageType(move.damageClass) + "defense"] * stageMultiplier(targetObject["stat-stages"][damageType(move.damageClass) + "defense"])
    damage = (((2*userObject.level/5 + 2) * move.power * attack/defense)/50 + 2) //base damage
    return damage
}

const calculateDamageMultipliers = (move, userObject, targetObject) => {
    const effectiveness = typeEfficiency(move.type, targetObject.type)
    
    let stab = 1
    if (userObject.type.find(type => type === move.type)) stab = 1.5 //if move has the same type as your pokemon, do 50% more damage
    
    let critMultiplier = 1
    if (Math.random() < critChance) {
        critMultiplier = 2
        textEvent.push("It was a critical hit")
    }
    let burn
    (move.damageClass === "physical" && userObject.status.name === "burn") ? burn = 0.5 : burn = 1

    const weatherMulti = weatherMultiplier(move.type, weather.name)

    return stab * effectiveness * critMultiplier * burn * weatherMulti
}

const applyStatChanges = (move, userObject, targetObject) => { 
    const statChangeText = statChange => {
        if (statChange > 1) return "sharply rose"
        if (statChange === 1) return "rose"
        if (statChange === -1) return "fell"
        if (statChange < -1) return "sharply fell"
        return ""
    }
    for (const statChange of move.statChanges) {

        if (move.effectChance) {
            if (Math.random() > move.effectChance/100) return
        }
        let target = (statChange.target === "user" ? userObject : targetObject)
        const stat = statChange.stat
        const stages = statChange.stages
        
        if (move.name === "hammer-arm") target = userObject //preventing this move from unintentionally lowering enemy speed

        target["stat-stages"][stat] += stages 
        textEvent.push(`${target.name} ${stat} ${statChangeText(stages)}`)
        if (target["stat-stages"][stat] >  6) {
            target["stat-stages"][stat] = 6
            textEvent.push(`${target.name} ${stat} is maxed out`)
        }
        if (target["stat-stages"][stat] < -6) {
            target["stat-stages"][stat] = -6
            textEvent.push(`${target.name} ${stat} is minimized`)
        }
    }
}

const useMove = async (move, user, enemy) => {
    damage = 0
    critChance = 1/24

    textEvent.push(`${user.name} used ${move.name}`)
    if (move.accuracy) { //checking if the move has accuracy or not (some has no accuracy and return null instead)
        if (Math.random() > move.accuracy/100) {
            textEvent.push("The attack missed")
            return 
        }
    }
    
    if (move.power) {//checking if the power is not null
        damage = calculateDamage(move, user, enemy) //calculating damage
        damage *= calculateDamageMultipliers(move, user, enemy)
    }

    applyStatChanges(move, user, enemy) //applying stat changes from moves

    moveEffectObject[move.name](move, user, enemy) //applying potential unique effects

    enemy.hp -= Math.ceil(damage) //apply the damage to the targets health
    move.pp -= 1
}

const createPokemonTeam = selectedPokemon => {
    const pokemonTeam = []
    for (const pokemon of selectedPokemon) {
        pokemonTeam.push(pokemonInfo[pokemon.alt])
    }
    return pokemonTeam
}

const createComputerTeam = unselectedPokemon => {
    //need to generate 3 non repeating indexes
    let indexOptions = []
    for (let i = 0; i < unselectedPokemon.length; i++){
        indexOptions.push(i)
    }

    const computerTeam = []
    while (computerTeam.length < 3) {
        const randomIndex = Math.floor(Math.random() * indexOptions.length)
        const index = indexOptions[randomIndex]
        computerTeam.push(pokemonInfo[unselectedPokemon[index].alt])
        indexOptions = indexOptions.filter(number => number !== index)
    }
    return computerTeam
}


const pickingPokemon = (event, pickArray) => {
    //adding your pokemon
    const selectedPokemon = event.target
    const selectedList = document.getElementById("selectedPokemon").children
    if (selectedList.length < 3 && includesHTMLNode(pickArray.children, selectedPokemon)) {
        document.getElementById("selectedPokemon").append(selectedPokemon)
    } else if (includesHTMLNode(selectedList, selectedPokemon)) {
        pickArray.append(selectedPokemon)
    }
    if (selectedList.length === 3) {
        const lockInButton = document.getElementById("lockIn")
        lockInButton.style["border-style"] = "solid"
        lockInButton.addEventListener("click", event =>{
            userPokemon = createPokemonTeam(selectedList)
            computerPokemon = createComputerTeam(pickArray.children)
            pokemonBattle(userPokemon, computerPokemon)
        })
    }
}

const pokemonBattle = () => {
    clearIndexHTML()
    loadBattle()
    updateBattleWindow()
    showMainSelect()
}

const computerAI = () => {
    //currently only selects a random move (disregarded of PP)
    const randomNumber = Math.floor(Math.random()*4)
    let index = 0

    for (const key in computerPokemon[0].moves) {
        if (index === randomNumber) {
            return computerPokemon[0].moves[key]
        }
        index++
    }   
}

const lostCheck = () => {
    let dead = 0
    for (const pokemon of userPokemon) {
        if (pokemon.hp <= 0) dead++
    }
    if (dead === userPokemon.length) return true
    else return false
    
}

const weatherEffect = () => {
    if (!weather.name) return
    switch (weather.name) {
        case "harsh sunlight":
            weather.turns -= 1
            if (weather.turns <= 0) {
                weather.name = ""
                textEvent.push(`The harsh sunlight faded`)
            } else textEvent.push(`The sunlight is strong`)
        break

        case "hail":
            if (!userPokemon[0].type.includes("ice")) {
                userPokemon.hp -= userPokemon[0].stats.hp / 16
                textEvent.push(`${userPokemon[0].name} got buffeted by the hail`)
            }
            if (!computerPokemon[0].type.includes("ice")) {
                computerPokemon[0].hp -= computerPokemon[0].stats.hp / 16
                textEvent.push(`${computerPokemon[0].name} got buffeted by the hail`)
            }
            weather.turns -= 1
            if (weather.turns <= 0) {
                weather.name = ""
                textEvent.push(`The hail stopped`)
            } else textEvent.push(`The hail continues to fall`)
            break
        case "rain":

            weather.turns -= 1
            if (weather.turns <= 0) {
                weather.name = ""
                textEvent.push(`The rain stopped`)
            } else textEvent.push(`The rain continues to fall`)
            break
        case "sandstorm": 

            let includes
            userPokemon[0].type.forEach(type => {
                if (["rock", "steel", "ground"].includes(type)) includes = true
            })
            if (!includes) {
                userPokemon.hp -= userPokemon[0].stats.hp / 16
                textEvent.push(`${userPokemon[0].name} got buffeted by the sandstorm`)
            }

            includes = false
            computerPokemon[0].type.forEach(type => {
                if (["rock", "steel", "ground"].includes(type)) includes = true
            })
            if (!includes) {
                computerPokemon.hp -= computerPokemon[0].stats.hp / 16
                textEvent.push(`${userPokemon[0].name} got buffeted by the sandstorm`)
            }
            weather.turns -= 1
            if (weather.turns <= 0) {
                weather.name = ""
                textEvent.push(`The sandstorm subsided`)
            } else textEvent.push(`The sandstorm rages`)
    }

}

const statusEffect = (pokemonObject, move) => {
    //status effects are: sleep, freeze, paralysis, burn, poison, badly poison
    if (!pokemonObject.status.name) return //check if status effect exist
    let statusDamage
    switch (pokemonObject.status.name) {
        case "sleep":
            pokemonObject.status.turns--
            if (pokemonObject.status.turns === 0) {
                pokemonObject["skipTurn"] = false
                textEvent.push(pokemonObject.name +" woke up")
                pokemonObject.status.name = ""
            } else {
                pokemonObject["skipTurn"] = true
                textEvent.push(pokemonObject.name +" is fast asleep")
            }
            break
        case "freeze":
            if (Math.random() <= 0.2 || move.name === "flare-blitz") {
                textEvent.push(pokemonObject.name +" thawed out")
                pokemonObject["skipTurn"] = false
                pokemonObject.status = {}
            } else {
                pokemonObject["skipTurn"] = true
                textEvent.push(pokemonObject.name +" is frozen solid")
            }
            break
        case "paralysis": 
            if (Math.random() <= 0.25) {
                textEvent.push(pokemonObject.name +" is paralyzed and can't move")
                pokemonObject["skipTurn"] = true
            }
            break
        case "burn": 
            statusDamage = Math.ceil(pokemonObject.stats.hp / 16)
            pokemonObject.hp -= statusDamage
            textEvent.push(pokemonObject.name +" is hurt from burn")
            break
        case "poison": 
            statusDamage = Math.ceil(pokemonObject.stats.hp / 16)
            pokemonObject.hp -= statusDamage
            textEvent.push(pokemonObject.name +" is hurt from poison")
            break
        case "badlyPoison":
            statusDamage = Math.ceil(pokemonObject.stats.hp * pokemonObject.status.stacks / 16)
            pokemonObject.hp -= statusDamage
            pokemonObject.status.stacks ++
            textEvent.push(pokemonObject.name +" is hurt from poison")
            break
    }
}

const conditionEffect = pokemonObject => {
    if (!pokemonObject.condition.name) return //check if condition effect exist
    switch (pokemonObject.condition.name) {
        case "confuse":
            pokemonObject.condition.turns -= 1
            if (pokemonObject.condition.turns === 0) {
                pokemonObject.condition.name = ""
                pokemonObject["skipTurn"] = false
                textEvent.push(pokemonObject.name +" snapped out of confusion")
            }
            textEvent.push(pokemonObject.name +" is confused")
            if (1/3 > Math.random()) {
                const damage = calculateDamage({power:40}, pokemonObject, pokemonObject)
                pokemonObject.hp -= Math.ceil(damage)
                textEvent.push(pokemonObject.name +" hurt them self in confusion")
                pokemonObject["skipTurn"] = true
            }
            break
        case "curse":
            const damage = pokemonObject.stats.hp / 4
            pokemonObject.hp -= Math.ceil(damage)
            textEvent.push(pokemonObject.name + " is cursed and lost some health")
            break
    }
}

const whichPokemon = (string) => { //string has to be either faster or slower, then this function will return that pokemon
    const computerDecision = computerPokemon[0]["decision"]
    const userDecision = userPokemon[0]["decision"]

    let paralysisSlowUser = 1
    if (userPokemon[0].status.name === "paralysis") paralysisSlowUser = 1/1.5
    let paralysisSlowComputer = 1
    if (computerPokemon[0].status.name === "paralysis") paralysisSlowComputer = 1/1.5

    const userSpeed = userPokemon[0].stats.speed * stageMultiplier(userPokemon[0]["stat-stages"].speed) * paralysisSlowUser
    const computerSpeed = computerPokemon[0].stats.speed * stageMultiplier(computerPokemon[0]["stat-stages"].speed) * paralysisSlowComputer

    let faster
    let slower

    if (userDecision.move) {
        if (userDecision.move.priority > computerDecision.move.priority) {
            faster = userPokemon[0]
            userPokemon[0]["turnOrder"] = "first"
            slower = computerPokemon[0]
            computerPokemon[0]["turnOrder"] = "second"
        } else if (userDecision.move.priority < computerDecision.move.priority) {
            faster = computerPokemon[0]
            computerPokemon[0]["turnOrder"] = "first"
            slower = userPokemon[0]
            userPokemon[0]["turnOrder"] = "second"
        } else if (userSpeed > computerSpeed) {
            faster = userPokemon[0]
            userPokemon[0]["turnOrder"] = "first"
            slower = computerPokemon[0]
            computerPokemon[0]["turnOrder"] = "second"
        } else { //if computer has the same or higher speed (which means on a tie we will prioritize the computer)
            faster = computerPokemon[0]
            computerPokemon[0]["turnOrder"] = "first"
            slower = userPokemon[0]
            userPokemon[0]["turnOrder"] = "second"
        }
    } else { //if user choses to switch pokemon then user goes first
        faster = userPokemon[0]
        userPokemon[0]["turnOrder"] = "first"
        slower = computerPokemon[0]
        computerPokemon[0]["turnOrder"] = "second"
    }

    if (string === "faster") return faster
    else return slower
}

const reactToFaint = async () => { //checks if any pokemon "faints" and then respond to it
    if (computerPokemon[0].hp <= 0) {
        computerPokemon[0]["skipTurn"] = true //stops recently "fainted" pokemon from using a move
        textEvent.push(`${computerPokemon[0].name} fainted`)
        computerPokemon.push(computerPokemon[0]) //put "fainted" pokemon last in array
        computerPokemon.splice(0,1) //remove "fainted" pokemon
        if (computerPokemon[0].hp <= 0) { //if next pokemon is "fainted" gg computer ran out of pokemon
            textEvent.push(`computer ran out of usable pokemon`)
            await displayEvent()
            endScreen("YOU WIN! ")
            return true //Tell daddy function to quit
        }
    } else if (userPokemon[0].hp <= 0) {
        textEvent.push(`${userPokemon[0].name} fainted`)
        if (lostCheck()) { //check if all your pokemon are "fainted"
            textEvent.push("you ran out of usable pokemon")
            await displayEvent()
            endScreen("YOU LOSE! ")
            return true
        } else {
            await displayEvent()
            userPokemon[0].forcedSwitch = true //storing that this is a forced switch
            showSwitchSelect()
            document.getElementById("theReturnButton").remove()
            return true
        }
    }

}

const moveTurn = async (user, target) => {
    if (user.decision.switch) return
    const move = user.decision.move
    
    if (!user.skipTurn) {
    statusEffect(user, move)
    await displayEvent()
    updateBattleWindow()
    if (await reactToFaint()) return true //reactToFaint will only return true if a pokemon dies
    }

    if (!user.skipTurn) {
    conditionEffect(user)
    await displayEvent()
    updateBattleWindow()
    if (await reactToFaint()) return true
    }

    if (!user.skipTurn){ 
        await useMove(move, user, target)
        await displayEvent()
        updateBattleWindow()
        if (await reactToFaint()) return true
    }

    user.skipTurn = false
    await displayEvent()
    updateBattleWindow()
}

const battleEventOrder = async () => {
    //activate pokemon switch if pokemon dies or show victory if no more pokemon
    computerPokemon[0]["decision"] = {move:computerAI()} //computerAI figures out a move to use
    const computerDecision = computerPokemon[0]["decision"]
    const userDecision = userPokemon[0]["decision"]

    if (userDecision.switch) {
        const forced = userPokemon[0].forcedSwitch //storing if the switch was forced
        textEvent.push("User switched to " + userDecision.switch)
        const index = userPokemon.findIndex(pokemon => pokemon.name === userDecision.switch)
        const pokemonObject = userPokemon.splice(index, 1) //move selected pokemon to the 0th index in the pokemonArray
        userPokemon.unshift(pokemonObject[0])
        await displayEvent()
        updateBattleWindow()
        if (forced) {
            showMainSelect()
            return
        }
    }

    const faster = whichPokemon("faster")
    const slower = whichPokemon("slower")

    if (weather.name) {
        weatherEffect()
        await displayEvent()
        updateBattleWindow()
    }
    
    if (await moveTurn(faster, slower)) return //moveTurn will only return true if game ends!!!
    if (await moveTurn(slower, faster)) return //return to exit out of battle loop

    if (userPokemon[0].forcedMove.length) {
        userPokemon[0]["decision"] = {move:userPokemon[0].forcedMove[0]}
        userPokemon[0].forcedMove.shift()
        battleEventOrder()
    }
    if (computerPokemon[0].forcedMove.length) {
        computerPokemon[0]["decision"] = {move:computerPokemon[0].forcedMove[0]}
        computerPokemon[0].forcedMove.shift()
        battleEventOrder()
    }
    showMainSelect()
}

document.addEventListener("DOMContentLoaded", event => {
    getDamageRelation()
    const pickArray = document.getElementById("selectPokemon")
    pokemonList.forEach(pokemon => {
        
        const name = Object.keys(pokemon)[0]
        pokemonInfo[name] = createPokemonObject(name, 50, pokemon[name], pokemon.img)
        const pickPokemon = document.createElement("img")
        pickPokemon.src = pokemon.img
        pickPokemon.alt = name
        pickPokemon.className = "pokemonIcons"
        
        pickArray.append(pickPokemon)
        pickPokemon.addEventListener("click", event => pickingPokemon(event, pickArray))  
        pickPokemon.addEventListener("mouseover", event => {
            const nameA= pokemonInfo[Object.keys(pokemon)[0]].name
            const attack = pokemonInfo[Object.keys(pokemon)[0]].stats.attack
            const defense= pokemonInfo[Object.keys(pokemon)[0]].stats.defense
            const specialAttack= pokemonInfo[Object.keys(pokemon)[0]].stats['special-attack']
            const specialDefense= pokemonInfo[Object.keys(pokemon)[0]].stats['special-defense']
            const speed = pokemonInfo[Object.keys(pokemon)[0]].stats.speed
            const moves= Object.keys(pokemonInfo[Object.keys(pokemon)[0]].moves).join(', ')
            const hp = pokemonInfo[Object.keys(pokemon)[0]].stats.hp
            

            const nameBar= document.getElementById("nameA")
            nameBar.textContent= nameA

            const moveBar = document.getElementById("moves")
            moveBar.textContent= "Moves: " + moves


            const attackBar= document.getElementById("attack")
            attackBar.textContent= "Attack: " + attack

            const defenseBar= document.getElementById("defense")
            defenseBar.textContent= "Defense: " + defense 

            const hpBar= document.getElementById("hp")
            hpBar.textContent= "HP: " + hp

            const specialAttackBar= document.getElementById("special-attack")
            specialAttackBar.textContent= "Special Attack: " + specialAttack

            const specialDefenseBar= document.getElementById("special-defense")
            specialDefenseBar.textContent= "Special Defense: "  + specialDefense 

            const speedBar= document.getElementById("speed")
            speedBar.textContent= "Speed: " + speed
   
        })
        })
    })
    


