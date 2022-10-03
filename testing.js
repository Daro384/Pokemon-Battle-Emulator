// const object = {a:1, b:2}
// for (const item of object) {
//     console.log(item)
// }

const stageMultiplier = stage => {
    return (stage >= 0 ? 1+0.5*stage : 1/(1+0.5*Math.abs(stage))) 
}

console.log(stageMultiplier(-1))