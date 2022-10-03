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

const createPokemonObject = (name, level, moves) => {
    const EV = 85
    const IV = 31
    const pokemonObject = {name:name, level:level, stats:{}}
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(res => res.json())
    .then(pokemon => {
        pokemon.stats.forEach(value => {
            pokemonObject.stats[value.stat.name] = statCalculator(value.base_stat, IV, EV, level, value.stat.name)
        })

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
let player1Pokemon = []
let player2Pokemon = []
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
            pokemonBattle()
        })
    }
}

const pokemonBattle = () => {
    // const player1PokemonImage = document.createElement("img")
    // player1PokemonImage.src = pokemon.img
    // for (const move in moves) {
    //     const newMove = document.createElement("h2")
    //     newMove.textContent = moves[move].name
    //     newMove.addEventListener("click", () => useMove(moves[move], pokemonInfo[name], pokemonInfo["gengar"]))
    //     document.getElementById("player1Pokemon").append(newMove)
    // }
    // document.getElementById("player1Pokemon").append(player1PokemonImage)


    // //adding enemy pokemon
    // const player2PokemonImage = document.createElement("img")
    // player2PokemonImage.src = pokemonList[4].img
    // document.getElementById("player2Pokemon").append(player2PokemonImage)
    // const attackButton = document.getElementById("attackButton")
}

document.addEventListener("DOMContentLoaded", event => {
    const pickArray = document.getElementById("selectPokemon")
    pokemonList.forEach(pokemon => {
        const name = Object.keys(pokemon)[0]
        pokemonInfo[name] = createPokemonObject(name, 50, pokemon[name])
        const pickPokemon = document.createElement("img")
        pickPokemon.src = pokemon.img

        pickArray.append(pickPokemon)

        pickPokemon.addEventListener("click", event => pickingPokemon(event, pickArray))
    })
})

