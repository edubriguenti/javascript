#! /usr/bin/env node

const axios = require('axios')
const readline = require('readline').createInterface({
    input: process.stdin,
    input: process.stdin,
    output: process.stdout,
    prompt: 'enter command > '
})

readline.prompt();
readline.on('line', async line => {
    switch (line.trim()) {
        case 'list vegan foods': {
             console.log('vegan food list');
             axios.get(`http://localhost:3001/food`).then(({data}) => {

                 function* listVeganFoods() {
                     try {
                         let idx = 0;
                         const veganOnly = data.filter(food => {
                             return food.dietary_preferences.includes('vegan');
                         })
                         const veganIterable = {
                             [Symbol.iterator]() {
                                 return {
                                     [Symbol.iterator]() { return this ;},
                                     next() {
                                         const current = veganOnly[idx];
                                         idx++;
                                         if (current) {
                                             return { value: current, done: false };
                                         } else {
                                             return { value: current, done: true };
                                         }
                                     }
                                 }
                             }
                         }
                     }catch(error) {
                         console.log('Something went wrong while listing vehan items', {
                             error
                         } );
                     }
                 }

                 for (let val of veganIterable) {
                     console.log(val.name);
                 }
                 readline.prompt();
             })
        }
        break;
        case 'log':
            const { data } = await axios.get(`http://localhost:3001/food`)
            const it = data[Symbol.iterator]();
            let actionIt;

            const actionIterator = {
                [Symbol.iterator]() {
                    let positions = [...this.actions];
                    return {
                        [Symbol.iterator]() {
                            return this;
                        },
                        next(...args) {
                            if (positions.length > 0) {
                                const position = positions.shift();
                                const result = position(...args);
                                return { value: result, done : false }
                            } else {
                                return { done : true }
                            }
                        },
                        return() {
                            positions = [];
                            return { done: true};
                        },
                        throw (error) {
                            console.log(error);
                            return { value: undefined, done: true };
                        }
                    }
                },
                actions: [askForServingSize, displayCalories],
            }

            function* actionGenerator() {
                try {
                    const food = yield;
                    const servingSize = yield askForServingSize();
                    yield displayCalories(servingSize, food);
                } catch(error) {
                    console.log({ error })
                }
            }

            function askForServingSize(food) {
                readline.question(`How many servings did you eat? (as a decimal 1, 0.5)`,
                    servingSize => {
                        if (servingSize === 'nevermind' || servingSize === 'n') {
                            actionIt.next();
                        } else if(typeof(parseFloat(servingSize)) !== 'number' || parseFloat(servingSize) == NaN){
                            console.log(typeof(servingSize))
                            console.log(servingSize)
                             actionIt.throw('Please, numbers only');
                        } else {
                            actionIt.next(servingSize, food)
                        }
                    })
            }

            async function displayCalories(servingSize = 1, food) {
                const calories = food.calories;
                console.log(`${food.name} with a serving side if ${servingSize} has ${Number.parseFloat(calories * parseInt(servingSize,10),).toFixed()} calories`);
                console.log("########1 ");
                const { data } = await axios.get(`http://localhost:3001/users/1`);
                console.log("########2 ");
                const usersLogs = data.log || [];
                const putBody = {
                    ...data,
                    log : [
                        ...usersLogs,
                        {
                            [Date.now()] : {
                                food: food.name,
                                servingSize,
                                calories: Number.parseFloat(
                                    calories * parseInt(servingSize, 10),
                                )
                            }
                        }
                    ]
                }
                console.log("########3 ");
                await axios.put(`http://localhost:3001/users/1`, putBody, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                console.log("########4 ");
                actionIt.next()
                console.log("########5 ");
                readline.prompt();
                console.log("########6 ");
            }

            readline.question(`What would you like to log today?`, async(item)=> {
                let position = it.next();
                while(!position.done) {
                    const food = position.value.name;
                    if (food === item) {
                        console.log(`${item}  has ${position.value.calories} calories`);
                        actionIt = actionIterator[Symbol.iterator]()
                        actionIt.next(position.value)
                    }
                    position = it.next();
                }
                readline.prompt();
            });
            break;
        case `today's log`:
            readline.question('Email: ', async emailAddress => {
                const { data } = await axios.get(
                    `http://localhost:3001/users?email=${emailAddress}`
                );
                const foodLog = data[0].log || [];
                let totalCalories = 0;
                function* getFoodLog(){
                    try {
                        yield* foodLog;
                    }catch (error) {
                        console.log('Something when wrong getting the log', {
                            error
                        })
                    }
                }
                const logIterator = getFoodLog();
                for (const entry of logIterator) {
                    const timestamp = Object.keys(entry)[0];
                    if (isToday(new Date(Number(timestamp)))) {
                        console.log(
                            `${entry[timestamp].food}, ${entry[timestamp].servingSize} servings(s)`,
                        );
                        totalCalories += entry[timestamp].calories;
                        if (totalCalories >= 12000) {
                            console.log(`Impressive! You've reached 12.000 calories`);
                            logIterator.return();
                        }
                    }
                }
                console.log('--------------------');
                console.log(`Total Calories: ${totalCalories}`);
                readline.prompt();
            });

            break;
    }
});

function isToday(timestamp) {
    const today = new Date();
    return (
        timestamp.getDate() === today.getDate() &&
        timestamp.getMonth() === today.getMonth() &&
        timestamp.getFullYear() === today.getFullYear()
    )
}


