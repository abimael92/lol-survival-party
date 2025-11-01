// storyData.js

const STORY_TEMPLATES = {
    VAMPIRE_MANSION: {
        title: "Midnight at Crimson Manor",
        mood: "Gothic horror with comedic undertones",
        intro: (players) => `The moon hung like a pale skull in the sky as ${generatePlayerList(players)} found themselves standing before the wrought-iron gates of Crimson Manor. What began as a dare had somehow led to this moment—the old Count's estate, abandoned for centuries, or so they thought. A cold wind whispered through the dead roses as the gates creaked open on their own...`,
        scenario: "Trapped in a vampire's mansion with a hungry host!",
        setting: "A decaying Victorian mansion filled with dusty antiques, covered furniture, and the faint scent of old blood and roses",
        antagonist: {
            name: "Count Vladimir Nightshade",
            description: "An ancient vampire with impeccable manners but terrible hunger",
            dialogue: [
                "Ah, fresh... visitors. How delightful.",
                "I do so enjoy when dinner delivers itself.",
                "Your blood smells... vintage. 1998 was a good year, I believe?"
            ]
        },
        crisis: "The Count's patience is wearing thin as dawn approaches! How does your item buy you more time?",
        items: ["rubber chicken", "whoopee cushion", "giant foam finger", "kazoo", "garlic-scented air freshener", "glitter bomb"],
        environmentalHazards: [
            "A suit of armor that moves when no one's looking",
            "Portraits with eyes that follow you",
            "A grandfather clock that chimes 13 times",
            "A library where the books rearrange themselves"
        ],
        victoryCondition: "Survive until sunrise or find the hidden holy water font"
    },

    ZOMBIE_MALL: {
        title: "Dawn of the Mall Walkers",
        mood: "Action-comedy with shopping chaos",
        intro: (players) => `What should have been a routine shopping trip for ${generatePlayerList(players)} turned into a nightmare when the emergency broadcast system crackled to life. 'REMAIN CALM. THE DEAD ARE WALKING. NO REFUNDS.' Now trapped in the Mega-Mall Magnifico, surrounded by the undead and endless sales racks...`,
        scenario: "Zombie horde in a shopping mall with limited escape routes!",
        setting: "A sprawling three-story mall with a food court, department stores, and surprisingly well-dressed zombies",
        antagonist: {
            name: "The Mall Manager (undead)",
            description: "A former retail manager who still enforces the 'no running' policy, even in undeath",
            dialogue: [
                "Excuse me! That's not an approved evacuation route!",
                "The undead apocalypse is no excuse for poor customer service!",
                "Would you like to apply for our Mall Rewards card before you die?"
            ]
        },
        crisis: "The zombie horde has you cornered near the food court! How does your item create an escape?",
        items: ["tennis racket", "duct tape", "super soaker", "fidget spinner", "annoying children's toy", "scented candle collection"],
        environmentalHazards: [
            "Escalators that randomly change direction",
            "Automatic doors that won't open",
            "A fountain that sprays something... questionable",
            "Zombies wearing 'Hello My Name Is' stickers"
        ],
        victoryCondition: "Reach the roof for evacuation or find the manager's master keys"
    },

    ALIEN_PROM: {
        title: "Invasion at Starlight Academy",
        mood: "Teen sci-fi comedy with dance breaks",
        intro: (players) => `The Starlight Academy prom was supposed to be the night ${generatePlayerList(players)} would never forget. The glittering decorations, the terrible DJ, the punch that definitely wasn't spiked... until the lights went out and the mothership descended. Now the aliens think our dance moves are a threat assessment!`,
        scenario: "Aliens have invaded the school prom and are judging humanity by our dance skills!",
        setting: "A high school gymnasium transformed into a cosmic wonderland, now with added extraterrestrials",
        antagonist: {
            name: "Xorblax the Judgmental",
            description: "An alien cultural attaché who finds human rituals baffling but fascinating",
            dialogue: [
                "Your mating rituals involve... grinding? How primitive!",
                "This 'Cha Cha Slide' appears to be some form of tribal warfare!",
                "Your species communicates through rhythmic gyrations? Intriguing!"
            ]
        },
        crisis: "The aliens are about to declare humanity 'too cringe to live'! How does your item prove we're worth keeping around?",
        items: ["disco ball fragment", "whoopie cushion", "kazoos", "glow sticks", "bad prom photo", "corsage launcher"],
        environmentalHazards: [
            "A dance floor that's actually an alien scanner",
            "Punch bowl that keeps refilling with mysterious liquid",
            "Balloons that float upward instead of down",
            "Teachers trying to maintain 'appropriate dancing distance'"
        ],
        victoryCondition: "Win the intergalactic dance-off or hack the alien sound system"
    },

    PIRATE_ISLAND: {
        title: "Treasure of the Giggling Ghost",
        mood: "Swashbuckling adventure with supernatural silliness",
        intro: (players) => `The map was clear: 'X marks the spot where laughter is buried.' ${generatePlayerList(players)} had followed the clues through stormy seas to this cursed island, where the legendary pirate Captain Chuckles was said to have hidden his greatest treasure—a joke so powerful it could make the dead laugh.`,
        scenario: "Cursed pirate island with a ghost captain who hates bad jokes!",
        setting: "A tropical island with talking parrots, quicksand that giggles, and palm trees that tell dad jokes",
        antagonist: {
            name: "Captain Chuckles (Ghost)",
            description: "A pirate ghost cursed to only speak in puns and terrible jokes",
            dialogue: [
                "Arrr, you ready to walk the planks? Get it? Planks?",
                "Why did the chicken cross the ocean? To get to the other tide!",
                "You think this is arrr-mless? Wait until you see my ghost ship!"
            ]
        },
        crisis: "Captain Chuckles is about to unleash his ultimate dad joke curse! How does your item counter his terrible humor?",
        items: ["whoopie cushion", "rubber chicken", "joy buzzer", "comedy prop nose", "silly string", "puns dictionary"],
        environmentalHazards: [
            "Sand that tickles your feet",
            "Coconuts that tell knock-knock jokes",
            "A treasure chest that laughs when opened",
            "Skeletons that do the macarena"
        ],
        victoryCondition: "Make the ghost laugh sincerely or find the anti-pun amulet"
    }
};

const NARRATIVE_TEMPLATES = {
    characterArcs: {
        brave: (playerName) => [
            `${playerName} took a deep breath, remembering their grandmother's advice: 'Sometimes you have to be the hero of your own story, even if it's a ridiculous one.'`,
            `With newfound courage, ${playerName} decided this was their moment to shine... or at least not die embarrassingly.`
        ],
        clever: (playerName) => [
            `${playerName}'s mind raced, connecting dots that probably shouldn't be connected. 'If A plus B equals C,' they muttered, 'then this should work... probably.'`,
            `A clever glint appeared in ${playerName}'s eyes as they devised a plan that was either genius or catastrophic.`
        ],
        chaotic: (playerName) => [
            `${playerName} shrugged. 'What's the worst that could happen?' Famous last words, but they were committed now.`,
            `Ignoring all common sense and several warning signs, ${playerName} decided to wing it with spectacular flair.`
        ]
    },

    resolutions: [
        (actions, crisis, players) => {
            const leadPlayer = players[Math.floor(Math.random() * players.length)];
            return `In a moment of pure inspiration, ${leadPlayer.name} led the way as ${actions}. The crisis "${crisis}" was resolved in the most absurdly brilliant way possible, leaving everyone wondering if they were geniuses or just incredibly lucky.`;
        },
        (actions, crisis, players) => {
            return `Through sheer determination and questionable life choices, ${actions}. Against all odds, they turned "${crisis}" into a triumph of human (and possibly alien/pirate/undead) ingenuity.`;
        }
    ],

    deaths: [
        (playerName, submission, item, scenario) => {
            const deaths = {
                VAMPIRE_MANSION: [
                    `${playerName} tried to ${submission} with the ${item}. The Count raised an eyebrow, then politely drained their blood. 'Terribly sorry,' he murmured, 'but that was just embarrassing.'`,
                    `As ${playerName} attempted ${submission}, the ${item} failed spectacularly. The vampires looked more disappointed than hungry.`
                ],
                ZOMBIE_MALL: [
                    `${playerName}'s attempt to ${submission} using the ${item} was met with blank zombie stares. Then hungry ones. The Mall Manager noted the violation of store policy.`,
                    `The ${item} proved useless as ${playerName} tried ${submission}. The zombies seemed almost offended by the lack of effort.`
                ],
                ALIEN_PROM: [
                    `${playerName} tried ${submission} with the ${item}. Xorblax consulted his tablet. 'Social miscalculation: 98%. Threat level: maximum cringe. Elimination protocol initiated.'`,
                    `As ${playerName} demonstrated ${submission}, the aliens collectively face-palmed (or whatever their equivalent was) before disintegrating them.`
                ],
                PIRATE_ISLAND: [
                    `${playerName} attempted ${submission} with the ${item}. Captain Chuckles groaned. 'That pun was so bad, it's lethal!' The ghostly laughter that followed was the last thing they heard.`,
                    `${playerName}'s ${submission} with the ${item} was met with supernatural disappointment. The island itself seemed to sigh before swallowing them whole.`
                ]
            };
            return deaths[scenario][Math.floor(Math.random() * deaths[scenario].length)];
        }
    ],

    continuations: [
        (remainingPlayers, sacrificedPlayer, scenario) => {
            const continuations = {
                VAMPIRE_MANSION: `${sacrificedPlayer.name} became the Count's latest vintage. ${generatePlayerList(remainingPlayers)} exchanged nervous glances, wondering who would be next to join the wine cellar.`,
                ZOMBIE_MALL: `As ${sacrificedPlayer.name} joined the ranks of the undead shoppers, ${generatePlayerList(remainingPlayers)} realized the food court was looking more appealing by the minute.`,
                ALIEN_PROM: `Xorblax made a note: 'Subject ${sacrificedPlayer.name} - too much cringe, not enough dance.' ${generatePlayerList(remainingPlayers)} tried to look more rhythmically gifted.`,
                PIRATE_ISLAND: `Captain Chuckles tipped his ghostly hat. 'That joke killed!' ${generatePlayerList(remainingPlayers)} decided maybe silence was the best policy.`
            };
            return continuations[scenario];
        }
    ],

    crises: [
        "The situation escalates dramatically! How does your item turn the tide?",
        "Just when you thought it couldn't get worse... it does! How does your item save the day?",
        "The stakes have never been higher (or more ridiculous)! How does your item provide the solution?",
        "Everything is falling apart in the most dramatic way possible! How does your item create a miracle?"
    ],

    environmentalDescriptions: [
        (scenario) => {
            const descriptions = {
                VAMPIRE_MANSION: "Dust motes danced in the moonlight like tiny ghosts. Somewhere, a pipe organ played itself, badly.",
                ZOMBIE_MALL: "The scent of cinnamon pretzels and decay created a uniquely mall-apocalypse aroma.",
                ALIEN_PROM: "The disco ball cast strange shadows that seemed to move independently of the light.",
                PIRATE_ISLAND: "The sand shifted in patterns that almost looked like smiling faces. Almost."
            };
            return descriptions[scenario];
        }
    ],

    itemDiscoveries: [
        (playerName, item, scenario) => {
            const discoveries = {
                VAMPIRE_MANSION: `${playerName} found a ${item} tucked behind a velvet curtain. How it got there was anyone's guess, but it looked promising.`,
                ZOMBIE_MALL: `Amid the chaos, ${playerName} spotted a ${item} in a shattered display case. Retail therapy takes on new meaning during the apocalypse.`,
                ALIEN_PROM: `${playerName} discovered a ${item} under the punch table. Whether it was left by humans or aliens was unclear, but it might help.`,
                PIRATE_ISLAND: `${playerName} dug up a ${item} from the suspiciously giggly sand. The island seemed to approve.`
            };
            return discoveries[scenario][Math.floor(Math.random() * discoveries[scenario].length)];
        }
    ],

    endings: [
        (winner, scenario) => {
            const endings = {
                VAMPIRE_MANSION: `As the first rays of dawn painted the sky, ${winner.name} stumbled out of Crimson Manor, covered in glitter and trailing a very confused rubber chicken. They had survived the night, and more importantly, they had the world's best 'you won't believe what happened' story.`,
                ZOMBIE_MALL: `The rescue helicopter descended as ${winner.name} waved from the roof, holding a half-eaten pretzel and the Mall Manager's name tag. They were the last one standing, and the only one who remembered to use their coupons.`,
                ALIEN_PROM: `Xorblax bowed respectfully. 'Your species shows... potential.' ${winner.name} stood alone on the dance floor, crown slightly askew, as the mothership departed. Prom King/Queen had never meant so much.`,
                PIRATE_ISLAND: `Captain Chuckles dissolved into genuine laughter. 'You've broken the curse!' ${winner.name} stood holding the treasure: a whoopee cushion that sounded like angelic trumpets. Some treasures are worth more than gold.`
            };
            return endings[scenario];
        }
    ],

    disconnects: [
        (playerName, scenario) => {
            const disconnects = {
                VAMPIRE_MANSION: `${playerName} suddenly vanished in a puff of logic. The Count sighed. 'Modern youth, no commitment to being properly terrified.'`,
                ZOMBIE_MALL: `${playerName} glitched out of existence. The zombies looked confused, then remembered they had other brains to snack on.`,
                ALIEN_PROM: `${playerName} pixelated and disappeared. Xorblax made a note: 'Human technology: unreliable. Dance skills: also unreliable.'`,
                PIRATE_ISLAND: `${playerName} was swept away by a wave of connectivity issues. Captain Chuckles muttered, 'Probably for the best—their puns were dreadful.'`
            };
            return disconnects[scenario];
        }
    ],

    // New: Character moments and development
    characterMoments: [
        (playerName) => `${playerName} had a sudden flash of insight, remembering something their weird uncle once said that finally made sense.`,
        (playerName) => `In this moment of chaos, ${playerName} realized they were actually enjoying themselves. This beat their day job.`,
        (playerName) => `${playerName} made a mental note: if they survived, they were definitely putting this on their resume.`
    ],

    // New: Collaborative moments
    teamworkMoments: [
        (players, action) => `In a beautiful moment of synchronization, ${generatePlayerList(players)} worked together to ${action}. It was almost like they knew what they were doing.`,
        (players, action) => `Through a series of gestures, confused looks, and one interpretive dance, ${generatePlayerList(players)} managed to ${action}. Teamwork makes the dream work!`
    ]
};

const stories = Object.values(STORY_TEMPLATES);

function generatePlayerList(players) {
    const names = players.map(p => p.name);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function getRandomCharacterArc() {
    const arcs = Object.keys(NARRATIVE_TEMPLATES.characterArcs);
    return arcs[Math.floor(Math.random() * arcs.length)];
}

function generateCharacterMoment(playerName) {
    const arcType = getRandomCharacterArc();
    const moments = NARRATIVE_TEMPLATES.characterArcs[arcType];
    return moments[Math.floor(Math.random() * moments.length)](playerName);
}

module.exports = {
    STORY_TEMPLATES,
    NARRATIVE_TEMPLATES,
    stories,
    generatePlayerList,
    generateCharacterMoment,
    getRandomCharacterArc
};