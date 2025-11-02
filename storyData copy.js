// storyData.js

const STORY_TEMPLATES = {
    VAMPIRE_MANSION: {
        title: "Midnight at Crimson Manor",
        mood: "Gothic horror with comedic undertones",
        intro: "The moon hung like a pale skull in the sky as {players} found themselves standing before the wrought-iron gates of Crimson Manor. What began as a dare had somehow led to this moment—the old Count's estate, abandoned for centuries, or so they thought. A cold wind whispered through the dead roses as the gates creaked open on their own...",
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
        intro: "What should have been a routine shopping trip for {players} turned into a nightmare when the emergency broadcast system crackled to life. 'REMAIN CALM. THE DEAD ARE WALKING. NO REFUNDS.' Now trapped in the Mega-Mall Magnifico, surrounded by the undead and endless sales racks...",
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
        intro: "The Starlight Academy prom was supposed to be the night {players} would never forget. The glittering decorations, the terrible DJ, the punch that definitely wasn't spiked... until the lights went out and the mothership descended. Now the aliens think our dance moves are a threat assessment!",
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
        intro: "The map was clear: 'X marks the spot where laughter is buried.' {players} had followed the clues through stormy seas to this cursed island, where the legendary pirate Captain Chuckles was said to have hidden his greatest treasure—a joke so powerful it could make the dead laugh.",
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
    resolutions: [
        (actions, crisis) => {
            return `Through sheer determination and questionable life choices, ${actions}. Against all odds, they turned "${crisis}" into a triumph of human (and possibly alien/pirate/undead) ingenuity.`;
        },
        (actions, crisis) => {
            return `In a moment of pure chaos and brilliance, ${actions}. The crisis "${crisis}" was resolved in the most absurdly effective way possible.`;
        },
        (actions, crisis) => {
            return `Somehow, against all logic and reason, ${actions}. The "${crisis}" was handled with such bizarre competence that even the universe seemed confused.`;
        }
    ],

    deaths: [
        (playerName, submission, item) => {
            const deaths = [
                `${playerName} tried to ${submission} with the ${item}. It failed so spectacularly that reality itself seemed to cringe.`,
                `As ${playerName} attempted ${submission}, the ${item} betrayed them in the most dramatic way possible. It was almost artistic.`,
                `${playerName}'s plan to ${submission} using the ${item} was so poorly conceived that even the ghosts felt secondhand embarrassment.`,
                `The ${item} proved utterly useless as ${playerName} tried ${submission}. The failure was so complete it was almost impressive.`
            ];
            return deaths[Math.floor(Math.random() * deaths.length)];
        }
    ],

    continuations: [
        (remainingPlayers, sacrificedPlayer) => {
            return `${sacrificedPlayer.name} met their end in a blaze of glorious failure. ${remainingPlayers.map(p => p.name).join(', ')} exchange nervous glances, wondering who's next.`;
        },
        (remainingPlayers, sacrificedPlayer) => {
            return `As ${sacrificedPlayer.name} joins the ranks of the fallen, ${remainingPlayers.map(p => p.name).join(', ')} realize the stakes just got real. And also ridiculous.`;
        }
    ],

    crises: [
        "The situation escalates dramatically! How does your item turn the tide?",
        "Just when you thought it couldn't get worse... it does! How does your item save the day?",
        "The stakes have never been higher (or more ridiculous)! How does your item provide the solution?",
        "Everything is falling apart in the most dramatic way possible! How does your item create a miracle?"
    ],

    endings: [
        (winner) => {
            return `${winner.name} stands victorious, covered in glitter, questionable substances, and the weight of absurd victory. They survived when others did not, proving that sometimes the weirdest plans work best.`;
        },
        (winner) => {
            return `Against all odds and several laws of physics, ${winner.name} emerges as the sole survivor. The adventure may be over, but the therapy bills are just beginning.`;
        }
    ],

    disconnects: [
        (playerName) => {
            return `${playerName} suddenly vanished in a puff of logic and poor internet connection. The universe shrugged and moved on.`;
        }
    ]
};

const stories = Object.values(STORY_TEMPLATES);

function generatePlayerList(players) {
    const names = players.map(p => p.name);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

module.exports = {
    STORY_TEMPLATES,
    NARRATIVE_TEMPLATES,
    stories,
    generatePlayerList
};