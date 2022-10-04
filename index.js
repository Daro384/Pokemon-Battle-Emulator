var pokemon2 = document.getElementById("bottom-left");
bottomPokemon(pokemon2);

function bottomPokemon(bottomPokemon) {
    var container = document.getElementById("container");
    const containerRect = container.getBoundingClientRect();
    bottomPokemon.style.position = 'absolute';
    bottomPokemon.style.left = (containerRect.left+10) + 'px';
    var pokemonPicSize = 150;
    var containerMargin = 10;
    bottomPokemon.style.top = (containerRect.bottom-(pokemonPicSize+containerMargin)) + 'px';
}

var pokemon1 = document.getElementById("top-right");
topPokemon(pokemon1);

function topPokemon(topPokemon) {
    var container = document.getElementById("container");
    const containerRect = container.getBoundingClientRect();
    topPokemon.style.position = 'absolute';
    var pokemonPicSize = 150; // pokemon pic size
    var containerMargin = 10; // padding of container div
    topPokemon.style.left = (containerRect.left+(containerRect.width-(pokemonPicSize+containerMargin))) + 'px';
    topPokemon.style.top = (containerRect.top+containerMargin) + 'px';
}


var pokemon2Stats = document.getElementById("Pokemon2");
bottomRightStats(pokemon2Stats);

function bottomRightStats(statsMenu) {
    var container = document.getElementById("container");
    const containerRect = container.getBoundingClientRect();
    const statsMenuRect = statsMenu.getBoundingClientRect();
    statsMenu.style.position = 'absolute';
    var containerMargin = 10; // padding of container div
    statsMenu.style.left = (containerRect.right-100) + 'px';
    statsMenu.style.top = (containerRect.bottom - statsMenuRect.height - containerMargin) + 'px';
}


function isTypeInDamageArray(pokemonType, damageArray) {
    for (let i = 0; i < damageArray.length; i++) {
        if(damageArray[i]['name'] == pokemonType) {
            return true;
        }
    }
    return false;
}

function getDamageMultiplier(attackPokemonType, defendingPokemonType) {
    var pokemonTypes = [];
    fetch(`https://pokeapi.co/api/v2/type`)
    .then(res => {
        res.json();
    })
    .then(res => {
        pokemonTypes = res['results'];
    })
    console.log(pokemonTypes);

    var attackPokemonIndex = 0;
    var defendingPokemonIndex = 0;
    for (let i = 0; i < pokemonTypes.length; i++) {
        if (pokemonTypes[i] == attackPokemonType) {
            attackPokemonIndex = i;
        }
        if (pokemonTypes[i] == defendingPokemonType) {
            defendingPokemonIndex = i;
        }
    }

    fetch(`https://pokeapi.co/api/v2/type/${attackPokemonIndex+1}`).then(res => res.json())
    .then(damageInfo => {
        multipliers = damageInfo['damage_relations']
        if (isTypeInDamageArray(defendingPokemonType, multipliers['double_damage_to'])) {
            return 2;
        }
        if (isTypeInDamageArray(defendingPokemonType, multipliers['half_damage_to'])) {
            return 0.5;
        }
        else {
            return 0;
        }
    })
}

getDamageMultiplier("normal", "rock");