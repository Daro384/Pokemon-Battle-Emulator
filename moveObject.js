const exampleMoveObject = {
    name:"rage",
    id:99,
    pp:20,
    accuracy:100,
    damageClass:"physical",
    power:20,
    priority:0,
    type:"normal",
    statChanges:[
        {
            target:"enemy",
            stat:"defense",
            stages:1,
            chance:100,
        }
    ],
    statusEffects:[
        {
        target:"enemy",
        status:"burn",
        chance:20
        }
    ], 
    otherEffects:[]
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
