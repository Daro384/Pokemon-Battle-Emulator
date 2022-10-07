const includesHTMLNode = (hTMLCollection, node) => { //would have used includes keyword, BUT HTMLCOLLECTIONS ARE FOR SOME REASON NOT ARRAYS. AHHHHHHH!!
    for (const element of hTMLCollection){
        if (element === node) return true
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

    const pokemon2Status = document.createElement("p")
    pokemon2Status.textContent = ""
    pokemon2Status.id = "pokemon2Status"
    textDiv2.append(pokemon2Status)

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

    const pokemon1Status = document.createElement("p")
    pokemon1Status.textContent = ""
    pokemon1Status.id = "pokemon1Status"
    textDiv1.append(pokemon1Status)

    const pokemon1IMG = document.createElement("img")
    pokemon1IMG.src = "./assets/alakazam.jpg"
    pokemon1IMG.id = "pokemon1IMG"
    pokemon1.append(pokemon1IMG)

    mainContainer.append(pokemon2)
    mainContainer.append(pokemon1)
}

const updateBattleWindow = () => {
    
    const pokemon1 = userPokemon[0]
    const pokemon2 = computerPokemon[0]
    document.getElementById("pokemon1Name").textContent = pokemon1.name.toUpperCase()
    document.getElementById("pokemon2Name").textContent = pokemon2.name.toUpperCase()
    document.getElementById("pokemon1Level").textContent = "LV" + pokemon1.level
    document.getElementById("pokemon2Level").textContent = "LV" + pokemon2.level
    document.getElementById("pokemon1IMG").src = pokemon1.img
    document.getElementById("pokemon1IMG").alt = pokemon1.name
    document.getElementById("pokemon2IMG").src = pokemon2.img
    document.getElementById("pokemon2IMG").alt = pokemon2.name
    document.getElementById("pokemon1HP").textContent = pokemon1.hp + " HP/" + pokemon1.stats.hp + " HP"
    document.getElementById("pokemon2HP").textContent = pokemon2.hp + " HP/" + pokemon2.stats.hp + " HP"

    const theStatus = pokemon => pokemon.status.name ? `status: ${pokemon.status.name}` : ""
    document.getElementById("pokemon1Status").textContent = theStatus(pokemon1)
    document.getElementById("pokemon2Status").textContent = theStatus(pokemon2)
}

const showMainSelect =  () => {
    createNavigationContainer()
    const fightButton = document.createElement("div")
    fightButton.id = "fightButton"
    document.getElementById("navContainer").append(fightButton)
    const fightText = document.createElement("h2")
    fightText.textContent = "FIGHT"
    fightButton.append(fightText)
    fightButton.addEventListener("click", event => {
        showMoveSelect()
    })

    const switchButton = document.createElement("div")
    switchButton.id = "switchButton"
    document.getElementById("navContainer").append(switchButton)
    const switchText = document.createElement("h2")
    switchText.textContent = "SWITCH"
    switchButton.append(switchText)
    switchButton.addEventListener("click", event => {
        showSwitchSelect()
    })
}

const returnButton =  () => {
    const returnSlot = document.createElement("div")
    const returnText = document.createElement("p")
    returnSlot.id = "theReturnButton"
    returnSlot.className = "switchPokemon returnButton"
    returnText.textContent = "Return"
    returnText.id = "returnText"
    returnSlot.append(returnText)
    document.getElementById("navContainer").append(returnSlot)
    returnSlot.addEventListener("click", event => {
        showMainSelect()
    })
}

const showMoveSelect =  () => {
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
        
        pokemonMove.addEventListener("mouseover", event => {
            showMoves(move)
        })
        pokemonMove.addEventListener("click", event => {
            if (userPokemon[0].moves[move].pp){
                userPokemon[0]["decision"] = {move:userPokemon[0].moves[move]}
                battleEventOrder()
            }
        })

    }
    returnButton()
}

const createNavigationContainer =  () => {
    if (document.getElementById("navContainer")) document.getElementById("navContainer").remove()
    const navigationContainer = document.createElement("div")
    navigationContainer.id = "navContainer"
    document.querySelector("main").append(navigationContainer)
}

const showMoves = move => {
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

            if (i){ //cant switch to current pokemon and current pokemon is always at index 0
                pokemonSlot.addEventListener("click", event => {
                    userPokemon[0]["decision"] = {switch:userPokemon[i].name}
                    userPokemon[i]["decision"] = {switch:userPokemon[i].name}  
                    battleEventOrder()
                })
            }
        }
    }
    returnButton()
}

const endScreen = (endMessage) => {
    clearIndexHTML()
    const lastDiv = document.createElement("div")
    lastDiv.id = "lastDiv"
    lastDiv.textContent = endMessage + "press F5 to play again"
    document.querySelector("main").append(lastDiv)
}

const displayEvent = async () => {
    createNavigationContainer()
    const display = document.getElementById("navContainer")
    const text = document.createElement("p")
    text.id = "displayText"
    display.append(text)
    const startLength = textEvent.length
    for (let i = 0; i < startLength; i++) {
        text.textContent = textEvent[0]
        textEvent.shift()
        await wait(2000)
    }
}

const wait = ms => { //stops the program for (ms) milliseconds
    return new Promise(resolve => setTimeout(resolve, ms))
}