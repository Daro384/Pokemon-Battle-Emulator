const replace = (string, word) => { 
    if (string.split("").includes("$")){
    const firstHalf = string.split("$")
    const secondHalf = firstHalf[1].split("%")
    secondHalf[0] = word
    return [firstHalf[0], ...secondHalf].join("")
    } else return string
}
console.log(replace("Has a $what% chance to paralyze the target.", "20%"))