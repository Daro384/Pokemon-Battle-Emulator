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


