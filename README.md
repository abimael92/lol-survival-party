# Story Sacrifice - Multiplayer Survival Game

A real-time multiplayer party game where players collaborate on absurd survival stories and vote to eliminate the weakest contributor each round.

## Overview

This is a full-stack **Node.js** application built with **Socket.io** for real-time communication. Players join games, receive ridiculous scenarios and items, then compete to create the most creative survival plans while voting to sacrifice players with the weakest contributions.

---

## Core Features

* Real-time multiplayer gameplay with **Socket.io**
* Dynamic AI-generated story progression
* Creative writing challenges with absurd items
* Social voting and elimination mechanics
* Responsive web interface with game state management
* QR code sharing for easy game joining

---

## System Architecture

```mermaid
graph TD
    A[Client (Browser)] -->|Socket.io Connection| B(Express Server)
    B --> C(Game Manager: State & Logic)
    C --> D(Story Generator: AI Narratives)
    D --> C
    C --> B
    B --> A
```

## Game Flow

sequenceDiagram
    participant P as Players
    participant H as Host
    participant S as Server
    P->>S: Create/Join Game
    H->>S: Start Game
    S->>P: Story Introduction & Crisis Scenario
    P->>S: Action Submission (60s limit)
    S->>P: Combined Resolution
    P->>S: Player Voting (45s limit)
    S->>P: Elimination
    alt Winner Exists
        S->>P: Game Winner
    else Continue
        S->>S: New Crisis
        S->>P: Continue Until Winner
    end

## Setup Guide

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
1. Clone or Download the Project

Extract the project files to your desired directory.

2. Install Dependencies

```bash
npm install
```

3. Start the Server

```bash
node server.js
```

4. Access the Game

Open your browser and navigate to http://localhost:3000

## File Structure

text
├── server.js                 # Main server file
├── gameManager.js           # Game logic and state management
├── storyGenerator.js        # AI story generation and narratives
├── package.json             # Project dependencies
├── package-lock.json        # Dependency lock file
└── public/                  # Client-side files
    ├── index.html           # Main game interface
    ├── client.js            # Client-side game manager
    ├── uiManager.js         # User interface management
    └── style.css            # Game styling


## Game Rules

### Phase 1: Story Introduction

- Players join a game with a unique code

- Host starts the game when 2+ players are present

- AI generates an absurd survival scenario

### Phase 2: Crisis & Action

- Each player receives a random silly item

- Players describe how they'd use their item to solve the crisis

- 60-second time limit for submissions

### Phase 3: Resolution & Voting

- All actions are combined into a comedic resolution

- Players vote on who had the worst plan

- Player with most votes is eliminated

### Phase 4: Continuation

- Story continues with remaining players

- New crises emerge each round

- Process repeats until one player remains

## API Events

### Client to Server

- create-game - Host creates new game

- join-game - Player joins existing game

- start-game - Host begins gameplay

- submit-action - Player submits survival plan

- submit-vote - Player votes for elimination

### Server to Client

- game-created - Confirmation of game creation

- player-joined - New player notification

- new-story - New scenario delivery

- story-resolution - Combined actions result

- player-sacrificed - Elimination announcement

- game-winner - Final victory declaration

### Game Scenarios

The game includes multiple themed scenarios:

- Vampire mansion with allergy-prone vampires

- Zombie horde in shopping mall

- Hostile alien on spaceship

- Mutant squirrel army attack

- Pudding dimension survival

### Items System

Players receive random absurd items each round:

- Rubber chickens, whoopee cushions, kazoos

- Giant foam fingers, silly putty, joy buzzers

- Rainbow wigs, oversized sunglasses

- And other novelty items

## Customization

### Adding New Scenarios
Edit stories array in storyGenerator.js:

javascript
{
    intro: "Custom introduction {players}",
    scenario: "Your custom scenario description",
    crisis: "The crisis players must solve",
    items: ["custom", "item", "list"]
}
Modifying Game Timing
Adjust timer durations in gameManager.js:

javascript
// Story phase timer (currently 20 seconds)
setTimeout(() => {}, 20000);

// Submission phase timer (currently 60 seconds)  
setTimeout(() => {}, 60000);

// Voting phase timer (currently 45 seconds)
setTimeout(() => {}, 45000);
Deployment
Local Network Play
Find your local IP address

Start the server: node server.js

Share: http://[YOUR_IP]:3000

Other devices on same network can join via game code

Production Deployment
For production deployment:

Set environment variable:

bash
export PORT=your_preferred_port
Use process manager like PM2:

bash
npm install -g pm2
pm2 start server.js
Troubleshooting
Common Issues
Game won't start:

Ensure at least 2 players have joined

Verify host privileges

Check console for error messages

Connection problems:

Verify server is running on correct port

Check firewall settings for local network play

Ensure all players are on same network

Game state issues:

Refresh browser to rejoin game

Host can restart if game becomes stuck

Debug Mode
Enable debug logging by uncommenting debug statements in gameManager.js:

javascript
console.log(`[DEBUG] Game phase: ${game.phase}`);
Contributing
To extend this project:

Follow existing code patterns in gameManager.js

Maintain Socket.io event structure

Preserve the humorous tone in storyGenerator.js

Test multiplayer functionality thoroughly

License
This project is provided for educational and entertainment purposes. Feel free to modify and distribute.

Version History
1.0 - Initial release with core gameplay

Features: Real-time multiplayer, AI storytelling, voting system

Technical: Socket.io, Express, vanilla JavaScript frontend