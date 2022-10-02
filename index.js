const api = "https://pokeapi.co/api/v2"

const statCalculator = (base, IV, EV, level, stat) => {
    // console.log(`base:${base}, iv: ${IV}, EV: ${EV}, level: ${level}, stat: ${stat}`)
    if (stat === "hp") {
        return Math.round((((2*base+IV+EV/4)*level)/100) + level + 10)
    }
    else {
        return Math.round(((2*base+IV+EV/4)*level)/100 + 5)
    }
}

const randomIV = () => {
    return Math.ceil(Math.random()*45)
}

const createPokemonObject = (apiCall, name, level) => {
    const EV = 85
    const pokemonObject = {name:name, level:level, stats:{}}
    fetch(`${api}/pokemon/${name}`).then(res => res.json())
    .then(pokemon => {
        pokemon.stats.forEach(value => {
            pokemonObject.stats[value.stat.name] = statCalculator(value.base_stat, randomIV(), EV, level, value.stat.name)
        })
        pokemonObject["type"] = pokemon.types.map(type => type.type.name)
        //adding stat stages
        pokemonObject["stat-stages"] = {}
        pokemonObject["stat-stages"]["attack"] = 0
        pokemonObject["stat-stages"]["defense"] = 0
        pokemonObject["stat-stages"]["special-attack"] = 0
        pokemonObject["stat-stages"]["special-defense"] = 0
        pokemonObject["stat-stages"]["speed"] = 0
    })  
    return pokemonObject
}


const moveList = ["tackle", "water-gun", "tail-whip", "protect", "growl", "scratch", "ember", "rage", "vine-whip", "growth", "sleep-powder"]

const initializeMoves = (moveList) => {
    const allowedMoves = {}
    moveList.forEach(move => {
        fetch(`${api}/move/${move}`).then(res => res.json())
        .then(returnedMove => {
            allowedMoves[returnedMove.name] = {
                name:returnedMove.name,
                power:returnedMove.power,
                pp:returnedMove.pp,
                priority:returnedMove.priority,
                id:returnedMove.id,
                damageClass:returnedMove.damage_class.name,
                accuracy:returnedMove.accuracy,
                type:returnedMove.type.name
            }
        })
    })
    return allowedMoves
}


const useMove = (move, user, enemy) => {
    if (!move.pp) return "Out of PP"
    if (move.power) {

        const stageMultiplier = stage => {
            return (stage >= 0 ? 1+0.5*stage : 1/(1+0.5*stage)) 
        }

        const damageType = damageClass => damageClass === "special" ? "special-" : "" //quick check to see if we should use special attack and special defense
        const attack = user.stats[damageType(move.damageClass) + "attack"] * stageMultiplier(user["stat-stages"][damageType(move.damageClass) + "attack"])
        const defense = enemy.stats[damageType(move.damageClass) + "defense"] * stageMultiplier(enemy["stat-stages"][damageType(move.damageClass) + "defense"])

        const typeEfficiency = 1 //do more damage based on type advantage
        let stab = 1
        if (user.type.find(type => type === move.type)) stab = 1.5 //if move has the same type as your pokemon, do 50% more damage
        
        const damage = Math.round((((2*user.level/5 + 2) * move.power * attack/defense)/50 + 2) * stab * typeEfficiency)
    
        enemyPokemonObject.stats.hp -= damage
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

    for (const statusEffect of move.statusEffect) {
        const target = (statChange.target === "user" ? user : enemy)
    }
}





let myPokemon
let enemyPokemon
let moves
let tackle
let tailWhip

const startButton = document.getElementById("startButton")
startButton.addEventListener("click", event => {
    myPokemon = createPokemonObject(api, "squirtle", 50)
    enemyPokemon = createPokemonObject(api, "charmander", 50)
    moves = initializeMoves(moveList)
    
    tailWhip = new Move(moves["tail-whip"], myPokemon, enemyPokemon)
})






const attackButton = document.getElementById("attackButton")
attackButton.addEventListener("click", event => {
    tackle = new Move(moves.tackle, myPokemon, enemyPokemon)
    tackle.useMove()
})

const effectButton = document.getElementById("tailWhip")
effectButton.addEventListener("click", event => {
    statsChange(enemyPokemon, "defense", -1)
})