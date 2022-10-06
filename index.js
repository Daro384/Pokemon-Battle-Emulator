//global variables
let damageRelation = {}
let pokemonInfo = {}
const textEvent = []
let moves
let userPokemon
let computerPokemon
let weather
let critChance = 1/24
let damage


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
        pokemonObject["condition"]
        
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
    return stab * effectiveness * critMultiplier * burn
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

}

const pokemonList = [ 
    {alakazam: ["calm-mind", "psychic", "psyshock", "recover"],           img:"./assets/alakazam.jpg"}, 
    {blastoise:["iron-defense", "hydro-pump", "rain-dance", "aqua-tail"], img: "./assets/blastoise.jpg"}, 
    {charizard:["flare-blitz", "inferno", "dragon-breath", "scary-face"], img: "./assets/charizard.jpg"},
    {gardevoir:["calm-mind", "hypnosis", "dream-eater", "psychic"],       img: "./assets/gardevoir.jpg"},
    {gengar:   ["shadow-ball", "sludge-bomb", "curse", "dark-pulse"],     img: "./assets/gengar.jpg"},
    {gyarados: ["dragon-dance", "thrash", "aqua-tail", "crunch"],         img: "./assets/gyarados.jpg"},
    {machamp:  ["double-edge", "cross-chop", "bulk-up", "revenge"],       img: "./assets/machamp.jpg"},
    {snorlax:  ["rest", "belly-drum", "body-slam", "hammer-arm"],         img: "./assets/snorlax.jpg"},
    {venusaur: ["solar-beam", "synthesis", "seed-bomb", "sleep-powder"],  img: "./assets/venusaur.jpg"},
    {walrein:  ["hail", "blizzard", "brine", "rest"],                     img: "./assets/walrein.jpg"},
]


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

const statusEffect = (pokemonObject, move) => {
    //status effects are: sleep, freeze, paralysis, burn, poison, badly poison
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
            let damage = Math.ceil(pokemonObject.stats.hp / 16)
            pokemonObject.hp -= damage
            textEvent.push(pokemonObject.name +" is hurt from burn")
            break
        case "poison": 
            damage = Math.ceil(pokemonObject.stats.hp / 16)
            pokemonObject.hp -= damage
            textEvent.push(pokemonObject.name +" is hurt from poison")
            break
        case "badlyPoison":
            damage = Math.ceil(pokemonObject.stats.hp * pokemonObject.status.stacks / 16)
            pokemonObject.hp -= damage
            pokemonObject.status.stacks ++
            textEvent.push(pokemonObject.name +" is hurt from poison")
            break
    }
}

const conditionEffect = pokemonObject => {
    //does something
}

const battleEventOrder = async userDecision => {
    //activate pokemon switch if pokemon dies or show victory if no more pokemon
    const computerMove = computerAI()

    if (userDecision.switch) {
        textEvent.push("User switched to " + userDecision.switch)
        const index = userPokemon.findIndex(pokemon => pokemon.name === userDecision.switch)
        const pokemonObject = userPokemon.splice(index, 1)
        userPokemon.unshift(pokemonObject[0])
        await displayEvent()
        updateBattleWindow()
    }
    if (weather) {
        textEvent.push("It is " + "weather")
        await displayEvent()
    }
    
    //figuring out which player goes first
    const userSpeed = userPokemon[0].stats.speed * stageMultiplier(userPokemon[0]["stat-stages"].speed)
    const computerSpeed = computerPokemon[0].stats.speed * stageMultiplier(computerPokemon[0]["stat-stages"].speed)

    const playerMove = [userDecision.move, computerMove]
    const player = [userPokemon, computerPokemon] //so I can select player based on 0 or 1 (used to be able to select the faster player)
    let first

    if (userDecision.move) {
        if (userDecision.move.priority > computerMove.priority) {
            first = 0 //first = user
        } else if (userDecision.move.priority < computerMove.priority) {
            first = 1 //first = computer
        } else if (userSpeed > computerSpeed) {
            first = 0
        } else first = 1 //if computer has the same or higher speed
    } else first = 0

    const second = first => {
        if (first === 0) {
            return 1
        } else return 0
    }

    const fasterPokemon = player[first][0]
    const slowerPokemon = player[second(first)][0]
    const fasterMove = playerMove[first]
    let slowerMove = playerMove[second(first)]
    let showSwitch = false //switch to true if user pokemon dies 
    
    const moveTurn = async (pokemonUser, targetPokemon, move) => {
        if (!move) return
        statusEffect(pokemonUser, move)
        conditionEffect(pokemonUser)
        if (!pokemonUser.skipTurn){
            await useMove(move, pokemonUser, targetPokemon)
            pokemonUser.skipTurn = false
        }

        if (targetPokemon.hp <= 0) {
            slowerMove = false //stopping dead pokemon from using move
            textEvent.push(`${targetPokemon.name} fainted`)
            if (computerPokemon[0].hp <= 0) { //checks if computer pokemon fainted
                computerPokemon.push(computerPokemon[0]) 
                computerPokemon.splice(0,1) //rotates computers pokemon
                if (computerPokemon[0].hp <= 0) {
                    textEvent.push("Computer ran out of pokemon. YOU WIN!") 
                    return
                } else textEvent.push("Computer sent out " + computerPokemon[0].name)

            } 
            else if (userPokemon[0].hp <= 0) {
                if (lostCheck()) { //if all pokemon are dead
                    textEvent.push("you ran out of pokemon. YOU LOSE!")
                } else { //if only current pokemon dies
                    showSwitch = true
                }
            }
        }

        await displayEvent()
        updateBattleWindow()
    }
    
    await moveTurn(fasterPokemon, slowerPokemon, fasterMove)
    await moveTurn(slowerPokemon, fasterPokemon, slowerMove)

    if (showSwitch) {
        showSwitchSelect()
        document.getElementById("theReturnButton").remove()
    }
    else showMainSelect()
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

        pickArray.append(pickPokemon)

        pickPokemon.addEventListener("click", event => pickingPokemon(event, pickArray))
    })
})