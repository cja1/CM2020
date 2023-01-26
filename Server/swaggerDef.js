module.exports = {
  openapi: '3.0.1',
  info: {
    title: 'Sequence API',
    description: "Welcome to the Sequence API documentation.<br/><br/>Developed for the UOL Computer Science Agile Software Development module by <b>Team 61</b> (T6G6).",
    version: '0.0.1'
  },
  servers: [
    { url: 'https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod' }
  ],
  tags: [
    { name: 'Games', description: 'The /games endpoint is the main endpoint used for creating a new game, joining an existing game, playing a round and getting the game state.<br/><br/>The expected order of events is:<ul><li>A player POSTs to the /games endpoint to create a new game. They receive a 4-digit game code. They pass this to the second player. The game status is "waitingForPlayers".</li><li>The second player POSTs to the /games/{code}/players endpoint to join the game. Now the game status is "active".</li><li>Turn-by-turn, each players POSTs to the /games/{code}/rounds endpoint with the card they want to play and the board position they want to play it. This continues until the game is won.</li><li>When the game is won the game status change to "ended"</li><li>At any time a player can get the game state by calling GET on /games/{code} endpoint. This returns the current game state.</li></ul>' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        description: '<br/><br/>We use Bearer authentication for requests to the Sequence API endpoints. The token is simply a UUID generated by the client. The UUID must remain the same between requests to uniquely identify the Player. In the code examples in the API documentation, replace {access-token} with a valid UUID.',
        type: 'http',
        scheme: 'bearer'
      }
    }
  }
};
