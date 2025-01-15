# Product Requirements Document (PRD)

## **Product Name:**

Alliance Wars

---

## **Overview:**

Alliance Wars is a strategy game operated entirely through WhatsApp. Players engage in forming alliances, battling opponents, and managing resources using simple text commands. The game logic is handled by a backend server, while WhatsApp serves as the user interface.

---

## **Goals:**

1. **Accessibility:** Provide a fun and engaging gaming experience without the need for downloading an app.
2. **Scalability:** Support multiple games simultaneously for players worldwide.
3. **Simplicity:** Ensure the user interface and commands are intuitive and easy to use.
4. **Monetization:** Implement sustainable revenue models to support ongoing development.

---

## **Target Audience:**

Casual and strategy gamers aged 15–40 who value accessible, social gaming experiences.

---

## **Core Features:**

### **Game Setup:**

- A central WhatsApp number handles all games.
- Players join a game by sending a unique game ID to the number.
- Game host defines parameters:
  - Total duration of the game.
  - Number of players.
  - Initial resources (coins, defense points, attack power).

### **Gameplay:**

- Actions are performed by sending text commands to the WhatsApp number.
- Key commands:
  - **Attack:** `Attack [Player Name]`
  - **Defend:** `Defend`
  - **Form Alliance:** `Alliance [Player Name]`
  - **Collect Resources:** `Collect`
- Game state updates are sent after each player action.

### **Alliance System:**

- Both players must independently send an alliance request for the alliance to form.
- Alliances allow resource sharing and joint attacks.
- Players can dissolve alliances at any time without notifying the partner.
- Alliance breakage can create strategic opportunities for deceit.

### **Resource Management:**

- Each player starts with:
  - **Coins:** For purchasing upgrades.
  - **Defense Points:** To absorb attacks.
  - **Attack Power:** Determines the damage dealt.
- Resource generation occurs periodically, as defined by the game host.

### **Combat Mechanics:**

- Each player can attack once every 6 hours.
- Damage = Attacker’s Attack Power – Defender’s Defense Points.
- Successful attacks steal coins from the defender.
- Players are notified of the outcome of their attacks.

### **Recovery for Weak Players:**

- Players with less than 50% of their starting resources receive a resource boost every 24 hours.
- Boosts include extra coins and defense points to maintain engagement.

### **Game End:**

- The game concludes when:
  - Time runs out.
  - Only one player or alliance remains.
- Winner determined by:
  - Resource count.
  - Number of successful battles.
  - Alliances maintained.

---

## **Technical Requirements:**

### **Backend:**

- **Language:** Node.js with Express.
- **Database:** Redis for real-time data storage.
- **Webhooks:** To handle WhatsApp messages.
- **Message Queue:** For processing high volumes of simultaneous actions.
- **API Documentation:** Create comprehensive API documentation for developers.

### **WhatsApp Integration:**

- Use **Meta Business API** or **Twilio API** for WhatsApp.
- Webhook setup to:
  - Receive incoming messages.
  - Send responses after processing.
- Message templates pre-approved by WhatsApp for faster response time.

### **Infrastructure:**

- **Hosting:** AWS or Google Cloud.
- **Scalability:** Auto-scaling to handle peaks in traffic.
- **Load Balancing:** Ensure even distribution of requests.
- **Logging and Monitoring:** Tools like Datadog or AWS CloudWatch for real-time monitoring and error detection.

### **Security:**

- **Data Encryption:** Use HTTPS and TLS for all communications.
- **Rate Limiting:** Prevent abuse of the WhatsApp API.
- **Authentication:** Verify game participants using unique IDs tied to phone numbers.
- **Backup System:** Daily backups of game state.

---

## **Design Considerations:**

### **User Commands:**

- Ensure all commands are simple and well-documented.
- Examples:
  - `Attack [Player Name]`
  - `Alliance [Player Name]`
  - `Status` — Check current resources and alliances.
  - `Leave Game` — Exit the current game.

### **Notifications:**

- Players receive updates on:
  - Attack results.
  - Resource generation.
  - Alliance formation/dissolution.
- Notifications must be concise and actionable.

### **Error Handling:**

- Inform users of invalid commands with clear instructions.
- Example: `"Invalid command. Please use 'Attack [Player Name]' or 'Defend'."`
- Handle edge cases, such as players trying to attack non-existent opponents.

---

## **Monetization Opportunities:**

1. **In-Game Purchases:**
   - Players buy extra resources or special abilities.
   - Example: “Double attack power for the next 6 hours”.
2. **Sponsored Games:**
   - Brands sponsor games and provide custom themes or prizes.
3. **Premium Features:**
   - Access to unique commands or advanced analytics.
4. **Subscription Model:**
   - Monthly subscriptions for exclusive benefits.

---

## **Roadmap:**

### **Phase 1: MVP (1 Month)**

- Basic WhatsApp integration.
- Core gameplay (attack, defense, alliances, resource generation).
- Basic logging and monitoring.

### **Phase 2: Enhanced Gameplay (2 Months)**

- Recovery mechanics for weak players.
- Notifications for key events.
- Improved combat mechanics.

### **Phase 3: Monetization and Scaling (3 Months)**

- Introduce in-game purchases.
- Optimize server for scalability.
- Expand to other messaging platforms (e.g., Telegram).

### **Phase 4: Advanced Features (6 Months)**

- Implement analytics dashboard for game hosts.
- Add customization options for game settings.
- Introduce AI-driven bots to fill in games with fewer players.

---

## **KPIs:**

- **Engagement:** Number of messages processed per day.
- **Retention:** Percentage of players completing a game.
- **Monetization:** Revenue per active user.
- **Scalability:** Maximum simultaneous games without performance degradation.

---

## **Risks and Mitigation:**

1. **Overload on Server:**
   - Use message queues and load balancers.
   - Implement caching for frequently requested data.
2. **Player Confusion:**
   - Provide clear onboarding messages and a help command.
   - Include FAQs in automatic responses.
3. **API Limitations:**
   - Plan for rate limits imposed by WhatsApp.
   - Use multiple WhatsApp numbers if necessary.
4. **Security Threats:**
   - Regularly update dependencies.
   - Conduct security audits on the backend.

---

## **Appendices:**

### Example Commands:

1. `Join Game [Game ID]`
2. `Attack [Player Name]`
3. `Alliance [Player Name]`
4. `Status`
5. `Leave Game`
6. `Help` — Get a list of all commands.

### WhatsApp Message Templates:

1. **Welcome Message:**
   - “Welcome to Alliance Wars! Your game ID is [GAME_ID]. Use the command ‘Help’ to get started.”
2. **Attack Notification:**
   - “[Player Name] attacked you! You lost [X Coins] and [Y Defense Points].”
3. **Resource Update:**
   - “You’ve collected [X Coins] and [Y Defense Points] this round.”
4. **Game Over Notification:**
   - “Game over! The winner is [Player Name/Alliance]. Thanks for playing!”

---

## **Technical Architecture Details:**

### **Testing Strategy:**

1. **Unit Testing:**

   - Jest for backend unit tests
   - Coverage requirement: minimum 80%
   - Mock external services (Twilio, Redis)

2. **Integration Testing:**

   - Supertest for API endpoint testing
   - End-to-end testing with real WhatsApp sandbox
   - Database integration tests

3. **Load Testing:**

   - Artillery.io for performance testing
   - Simulate 1000+ concurrent users
   - Test scenarios:
     - Multiple simultaneous attacks
     - Mass alliance formations
     - Resource collection spikes

4. **User Acceptance Testing:**
   - Beta testing phase with 100 users
   - Feedback collection through in-game commands
   - Performance metrics tracking

### **Deployment Pipeline:**

1. **CI/CD Workflow:**

   ```yaml
   - Build: npm build
   - Test: Jest + Coverage
   - Lint: ESLint
   - Security: npm audit
   - Deploy: AWS CodeDeploy
   ```

2. **Environments:**

   - Development: Feature testing
   - Staging: Pre-release testing
   - Production: Live environment
   - Each with isolated Redis instances

3. **Release Process:**
   - Feature branch → Develop → Staging → Main
   - Automated deployment to staging
   - Manual approval for production
   - Rollback procedures defined

### **System Architecture:**

1. **Components:**

   ```
   [WhatsApp] ←→ [Load Balancer] ←→ [API Servers] ←→ [Redis Cluster]
                                          ↓
                                   [Message Queue]
                                          ↓
                                  [Game Logic Workers]
   ```

2. **Database Schema:**

   ```typescript
   Game {
     id: string
     status: 'pending' | 'active' | 'completed'
     startTime: Date
     endTime: Date
     players: Player[]
     settings: GameSettings
   }

   Player {
     id: string
     phoneNumber: string
     resources: {
       coins: number
       defensePoints: number
       attackPower: number
     }
     lastAttack: Date
     alliances: string[]
   }

   GameSettings {
     duration: number
     maxPlayers: number
     initialResources: Resources
     cooldowns: {
       attack: number
       collect: number
     }
   }
   ```

3. **API Endpoints:**

   ```typescript
   POST / api / game / create;
   POST / api / game / join;
   POST / api / game / { id } / action;
   GET / api / game / { id } / status;
   POST / api / game / { id } / alliance;
   POST / api / game / { id } / attack;
   GET / api / player / { id } / resources;
   ```

4. **Monitoring:**
   - Datadog for system metrics
   - Sentry for error tracking
   - Custom dashboard for game metrics
   - WhatsApp delivery status tracking

---

This PRD provides all the necessary details for developing and launching Alliance Wars. It covers technical, design, and monetization aspects to ensure a successful production.
