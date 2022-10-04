const statCalculator = (base, IV, EV, level, stat) => {
    // console.log(`base:${base}, iv: ${IV}, EV: ${EV}, level: ${level}, stat: ${stat}`)
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
                effect: returnedMove.effect_entries[0].short_effect
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
        
    })  
    return pokemonObject
}


const useMove = (move, user, enemy) => {
    if (!move.pp) return "Out of PP"
    if (move.power) {

        const stageMultiplier = stage => {
            return (stage >= 0 ? 1+0.5*stage : 1/(1+0.5*Math.abs(stage))) 
        }
        
        const damageType = damageClass => damageClass === "special" ? "special-" : "" //quick check to see if we should use special attack and special defense
        const attack = user.stats[damageType(move.damageClass) + "attack"] * stageMultiplier(user["stat-stages"][damageType(move.damageClass) + "attack"])
        const defense = enemy.stats[damageType(move.damageClass) + "defense"] * stageMultiplier(enemy["stat-stages"][damageType(move.damageClass) + "defense"])

        const typeEfficiency = 1 //do more damage based on type advantage
        let stab = 1
        if (user.type.find(type => type === move.type)) stab = 1.5 //if move has the same type as your pokemon, do 50% more damage
        
        const damage = Math.round((((2*user.level/5 + 2) * move.power * attack/defense)/50 + 2) * stab * typeEfficiency)
    
        enemy.stats.hp -= damage
        console.log(damage)
    }

    for (const statChange of move.statChanges) { 
        const target = (statChange.target === "user" ? user : enemy)
        const stat = statChange.stat
        const stages = statChange.stages
        target["stat-stages"][stat] += stages 
        if (target["stat-stages"][stat] >  6) target["stat-stages"][stat] = 6
        if (target["stat-stages"][stat] < -6) target["stat-stages"][stat] = -6
    }
}



let pokemonInfo = {}
let moves
let userPokemon
let computerPokemon

const pokemonList = [
    {alakazam:["calm-mind", "psychic", "psyshock", "recover"], img:"./assets/alakazam.jpg"}, 
    {blastoise:["iron-defense", "hydro-pump", "rain-dance", "aqua-tail"], img: "./assets/blastoise.jpg"}, 
    {charizard:["flare-blitz", "inferno", "dragon-breath", "scary-face"], img: "./assets/charizard.jpg"},
    {gardevoir:["calm-mind", "hypnosis", "dream-eater", "psychic"], img: "./assets/gardevoir.jpg"},
    {gengar:["shadow-ball", "sludge-bomb", "curse", "dark-pulse"], img: "./assets/gengar.jpg"},
    {gyarados:["dragon-dance", "thrash", "aqua-tail", "crunch"], img: "./assets/gyarados.jpg"},
    {machamp:["double-edge", "cross-chop", "bulk-up", "revenge"], img: "./assets/machamp.jpg"},
    {snorlax:["rest", "belly-drum", "body-slam", "block"], img: "./assets/snorlax.jpg"},
    {venusaur:["solar-beam", "synthesis", "seed-bomb", "sleep-powder"], img: "./assets/venusaur.jpg"},
    {walrein:["hail", "blizzard", "brine", "rest"], img: "./assets/walrein.jpg"},
]

const includesHTMLNode = (hTMLCollection, node) => { //would have used includes keyword, BUT HTMLCOLLECTIONS ARE FOR SOME REASON NOT ARRAYS. AHHHHHHH!!
    for (const element of hTMLCollection){
        if (element === node) return true
    }
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
//replaces a word in a string that's in between $ and % -> replace("hello $name%", Daro) => "hello Daro"
//used to deal with some returned api strings
const replace = (string, word) => { 
    if (string.split("").includes("$")){
    const firstHalf = string.split("$")
    const secondHalf = firstHalf[1].split("%")
    secondHalf[0] = word
    return [firstHalf[0], ...secondHalf].join("")
    } else return string
}

const clearIndexHTML = () => {
    document.querySelector("main").remove()
    document.querySelector("body").append(document.createElement("main"))
}
const pokemonBattle = () => {
    clearIndexHTML()
    loadBattle()
    updateBattleWindow()
    showMainSelect()
    
}
const loadBattle = () => {
    const mainContainer = document.createElement("div")
    mainContainer.id = "container"
    document.querySelector("main").append(mainContainer)

    const pokemon2 = document.createElement("div")
    pokemon2.className = "pokemon"

    const textDiv2 = document.createElement("div")
    textDiv2.id = "pokemon2text"
    textDiv2.className = "pokemon-text"
    pokemon2.append(textDiv2)

    const pokemon2Name = document.createElement("h3")
    pokemon2Name.textContent = "pokemon2"
    pokemon2Name.id = "pokemon2Name"
    textDiv2.append(pokemon2Name)

    const pokemon2Level = document.createElement("p")
    pokemon2Level.textContent = "LV 50"
    pokemon2Level.id = "pokemon2Level"
    textDiv2.append(pokemon2Level)

    const pokemon2HP = document.createElement("p")
    pokemon2HP.textContent = "HP: 123/123"
    pokemon2HP.id = "pokemon2HP"
    textDiv2.append(pokemon2HP)

    const pokemon2IMG = document.createElement("img")
    pokemon2IMG.src = "./assets/alakazam.jpg"
    pokemon2IMG.id = "pokemon2IMG"
    pokemon2.append(pokemon2IMG)

    const pokemon1 = document.createElement("div")
    pokemon1.className = "pokemon"

    const textDiv1 = document.createElement("div")
    textDiv1.id = "pokemon1text"
    textDiv1.className = "pokemon-text"
    pokemon1.append(textDiv1)

    const pokemon1Name = document.createElement("h3")
    pokemon1Name.textContent = "pokemon1"
    pokemon1Name.id = "pokemon1Name"
    textDiv1.append(pokemon1Name)

    const pokemon1Level = document.createElement("p")
    pokemon1Level.textContent = "LV 50"
    pokemon1Level.id = "pokemon1Level"
    textDiv1.append(pokemon1Level)

    const pokemon1HP = document.createElement("p")
    pokemon1HP.textContent = "HP: 123/123"
    pokemon1HP.id = "pokemon1HP"
    textDiv1.append(pokemon1HP)

    const pokemon1IMG = document.createElement("img")
    pokemon1IMG.src = "./assets/alakazam.jpg"
    pokemon1IMG.id = "pokemon1IMG"
    pokemon1.append(pokemon1IMG)

    mainContainer.append(pokemon2)
    mainContainer.append(pokemon1)
}
const createNavigationContainer = () => {
    const navigationContainer = document.createElement("div")
    navigationContainer.id = "navContainer"
    document.querySelector("main").append(navigationContainer)
}

const updateBattleWindow = () => {
    const pokemon1 = userPokemon[0]
    const pokemon2 = computerPokemon[0]
    document.getElementById("pokemon1Name").textContent = pokemon1.name.toUpperCase()
    document.getElementById("pokemon2Name").textContent = pokemon2.name.toUpperCase()
    document.getElementById("pokemon1Level").textContent = pokemon1.level
    document.getElementById("pokemon2Level").textContent = pokemon2.level
    document.getElementById("pokemon1IMG").src = pokemon1.img
    document.getElementById("pokemon1IMG").alt = pokemon1.name
    document.getElementById("pokemon2IMG").src = pokemon2.img
    document.getElementById("pokemon2IMG").alt = pokemon2.name
    document.getElementById("pokemon1HP").textContent = pokemon1.hp + " HP/" + pokemon1.stats.hp + " HP"
    document.getElementById("pokemon2HP").textContent = pokemon2.hp + " HP/" + pokemon2.stats.hp + " HP"
}

const showMainSelect = () => {
    createNavigationContainer()
    const fightButton = document.createElement("div")
    fightButton.id = "fightButton"
    document.getElementById("navContainer").append(fightButton)
    const fightText = document.createElement("h2")
    fightText.textContent = "FIGHT"
    fightButton.append(fightText)
    fightButton.addEventListener("click", event => {
        document.getElementById("navContainer").remove()
        showMoveSelect()
    })

    const switchButton = document.createElement("div")
    switchButton.id = "switchButton"
    document.getElementById("navContainer").append(switchButton)
    const switchText = document.createElement("h2")
    switchText.textContent = "SWITCH"
    switchButton.append(switchText)
    switchButton.addEventListener("click", event => {
        document.getElementById("navContainer").remove()
        showSwitchSelect()
    })
}

const returnButton = () => {
    const returnSlot = document.createElement("div")
    const returnText = document.createElement("p")
    returnSlot.className = "switchPokemon returnButton"
    returnText.textContent = "Return"
    returnText.id = "returnText"
    returnSlot.append(returnText)
    document.getElementById("navContainer").append(returnSlot)
    returnSlot.addEventListener("click", event => {
        document.getElementById("navContainer").remove()
        showMainSelect()
    })
}

const showMoveSelect = () => {
    createNavigationContainer()
    const moveInfo = document.createElement("div")
    moveInfo.id = "moveInfo"
    document.getElementById("navContainer").append(moveInfo)
    for (const move in userPokemon[0].moves) {
        const pokemonMove = document.createElement("div")
        pokemonMove.className = "pokeMove"
        document.getElementById("navContainer").append(pokemonMove)

        const moveName = document.createElement("h3")
        moveName.className = "moveName"
        moveName.textContent = move
        pokemonMove.append(moveName)
        const PP = document.createElement("p")
        PP.className = "moveText"
        PP.textContent = "PP: " + userPokemon[0].moves[move].pp
        pokemonMove.append(PP)

        const power = document.createElement("p")
        power.className = "moveText"
        power.textContent = "Power: " + userPokemon[0].moves[move].power
        pokemonMove.append(power)
        
        pokemonMove.addEventListener("click", event => {
            showMoves(move)
        })

    }
    returnButton()
}

const showMoves = (move) => {
    //shows the move details of a move
    const theLength = document.getElementById("moveInfo").children.length
    for (let i = 0; i < theLength; i++) {
        document.getElementById("moveInfo").children[0].remove()
    }
    const moveNameDetail  = document.createElement("h3")
    const ppDetail        = document.createElement("p")
    const typeDetails     = document.createElement("p")
    const powerDetails    = document.createElement("p")
    const accuracyDetails = document.createElement("p")
    const effectText      = document.createElement("p")
    moveNameDetail .className = "detailText"
    ppDetail       .className = "detailText"
    typeDetails    .className = "detailText"
    powerDetails   .className = "detailText"
    accuracyDetails.className = "detailText"
    effectText     .className = "detailText"
    moveNameDetail.textContent = move
    ppDetail.textContent = "PP: " + userPokemon[0].moves[move].pp
    typeDetails.textContent = "Type:" + userPokemon[0].moves[move].type
    if (userPokemon[0].moves[move].power){
        powerDetails.textContent = "Power: " + userPokemon[0].moves[move].power + userPokemon[0].moves[move].damageClass
    }
    if (userPokemon[0].moves[move].accuracy){
        accuracyDetails.textContent = "Accuracy: " + userPokemon[0].moves[move].accuracy
    }
    const effect = userPokemon[0].moves[move].effect
    const effectChance = userPokemon[0].moves[move].effectChance + "%"
    effectText.textContent = replace(effect, effectChance)
    moveInfo.append(moveNameDetail )
    moveInfo.append(ppDetail       )
    moveInfo.append(typeDetails    )
    moveInfo.append(powerDetails   )
    moveInfo.append(accuracyDetails)
    moveInfo.append(effectText     )
    moveInfo.style.backgroundColor = "greenyellow"
    
}

const showSwitchSelect = () => {
    createNavigationContainer()
    for (let i = 0; i < 6; i++) {
        const pokemonSlot = document.createElement("div")
        pokemonSlot.id = "pokemonSlot" + i
        pokemonSlot.className = "switchPokemon"
        document.getElementById("navContainer").append(pokemonSlot)

        if (userPokemon[i]){
            const pokemonIMG = document.createElement("img")
            pokemonIMG.className = "slotImage"
            pokemonIMG.src = userPokemon[i].img
            pokemonIMG.alt = userPokemon[i].name
            pokemonSlot.append(pokemonIMG)

            const pokeName = document.createElement("p")
            pokeName.className = "slotName"
            pokeName.textContent = userPokemon[i].name
            pokemonSlot.append(pokeName)

            const pokeHealth = document.createElement("p")
            pokeHealth.className = "slotHP"
            pokeHealth.textContent = userPokemon[i].hp + " HP/" + userPokemon[i].stats.hp + " HP"
            pokemonSlot.append(pokeHealth)

            if (i){ //cant switch to current pokemon and current pokemon is always at index 1
            const decisionObject = {switch:userPokemon[i].name}
            pokemonSlot.addEventListener("click", event => battleEventOrder(decisionObject))
            }
        }
    }
    returnButton()
}

// const computerAI = () => {
//     //currently only selects a random move (disregarded of PP)
//     const randomNumber = Math.floor(Math.random()*4)
//     let index = 0
//     for (const key in computerPokemon[0].moves) {
//         if (index === randomNumber) {

//         }
//     }
// }

displayEvent = string => {
    console.log(string)
}

battleEventOrder = (userDecision) => {
    //activate if players switched pokemon
    //activate weather effect
    //activate condition effect
    //activate status effect
    //activate move for both players
    //activate pokemon switch if pokemon dies or show victory if no more pokemon


    if (userDecision.switch) {
        displayEvent("User switched to " + userDecision.switch)
        const index = userPokemon.findIndex(pokemon => pokemon.name === userDecision.switch)
        const pokemonObject = userPokemon.splice(index, 1)
        userPokemon.unshift(pokemonObject[0])
        updateBattleWindow()
    }
}

document.addEventListener("DOMContentLoaded", event => {
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