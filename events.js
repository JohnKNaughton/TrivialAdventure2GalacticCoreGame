var gameEvents = [
    {
        id: 'Lilguy',
        title: 'Just a Lil Guy',
        story: 'You step out of the ship into a rough and tumble, backwater saloon town, filled with all sorts of characters. A small orange creature of unknown species approaches you with a proposition.',
        image: 'assets/Lilguy.png',
        options: [
            {
                label: 'Rub his belly',
                desc: 'Low risk, low reward. He pays you for your time ',
                reward: { credits: 8 },
                cost: null
            },
            {
                label: 'Sample his exotic snacks',
                desc: 'He offers to let you try his purple and green poofy puffs. They are delicious, you purchase some from his stock for the rest of the crew.',
                reward: { food: 20 },
                cost: { credits: 5 },
                costLabel: '-5 Credits'
            },
            {
                label: 'Trust him',
                desc: 'He leads you to the cave of unknowable horrors. After what seems like an eternity to you, you emerge 20 minutes later to his outstreched hand',
                reward: { trivium: 50 },
                cost: { credits: 20 },
                costLabel: '-20 Credits'
            }
        ]
    },
    {
        id: 'PulsarLibrary',
        title: 'Pulsar Library',
        story: 'You pull the ship up next to a massive complex sitting in the blindspot of a Pulsar. Entering with your crew, you are amazed at the endless rows of stored knowledge.',
        image: 'assets/Library.png',
        options: [
            {
                label: 'Study the texts',
                desc: 'You and your crew spend the afternoon reading what looks important.',
                reward: { trivium: 12 },
                cost: null
            },
            {
                label: 'Study ALL the texts',
                desc: 'Time seems not to pass in this library, you and your crew buckle down.',
                reward: { trivium: 42 },
                cost: { food: 15 },
                costLabel: '-15 Food'
            },
            {
                label: 'Talk to the Janitor',
                desc: 'The Library Custodian is a Tardigrade of immense wisdom. He offers to clone one of your buddies, so their effect is doubled for the rest of the run.',
                reward: {},
                cost: { food: 5 },
                costLabel: '-5 Food',
                specialAction: 'clone_buddy'
            }
        ]
    },
    {
        id: 'nerds',
        title: 'Interstellar Nerds',
        story: 'You happen across a derelict machine repair shop. Following a noise that sounds like a laughing cherub, you enter a room with three lounging aliens. These are truly the masters of irrelevant knowledge',
        image: 'assets/Nerds.png',
        options: [
            {
                label: 'Scan the room in horror',
                desc: 'This is not a place for productive people. You quickly retreat to the ship.',
                reward: { trivium: 6 },
                cost: null
            },
            {
                label: 'Crack a reference',
                desc: 'You make a obscure reference to the popular program Trek Wars. All three aliens burst into laughter, you realize the cherub laugh is coming from the rotund toad. ',
                reward: { credits: 25, food: 8 },
                cost: { trivium: 9 },
                costLabel: '-9 Trivium'
            },
            {
                label: 'Be a guest star on their program',
                desc: 'A lifelong dream of yours, you join the fellows for an extended hang',
                reward: { trivium: 75 },
                cost: { food: 30 },
                costLabel: '-30 food'
            }
        ]
    }
];
