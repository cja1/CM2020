# Agile Software Development: Team 61 Github repo

### File Organisation

**HiFi Mockup**: Swift prototype to test 2 different high fidelity mockups of the main board screen.

**Server**: Node code that implements the API. The API is implemented as a series of micro-services in the Server/lambda folder.

**sequence-api-slate**: Slate-style API documentation. Documentation available here: [https://compsci.s3.eu-west-1.amazonaws.com/CM2020/api/index.html](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/api/index.html) 

**sequence-api-swagger**: Swagger-style API documentation. Documentation available here: [https://compsci.s3.eu-west-1.amazonaws.com/CM2020/swagger/index.html](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/swagger/index.html)

**client-demo**: Four web client examples that accesses the endpoints - used for testing:
1. Basic game create / join / play round example: [https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/index.html](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/index.html)
2. Game with bot play option - to demonstrate the game play. Player 2 is a bot: [https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/autoplay.html](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/autoplay.html)
3. Game with board visualisation. Player 2 is a bot: [https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/autoplayBoard.html](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/autoplayBoard.html)
3. Game outcome visualisation tool, showing the outcomes of the last 100 completed games with the 4 different ways to win (row, column, diagonal downwards line, diagonal upwards line): [https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/visualisation.html](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/client-demo/visualisation.html)


**client-web**: A P5-based web client as an MVP version of the game. Available to play here: [https://sequence.agileprojects.com](https://sequence.agileprojects.com)

**wip-client-web-v2**: Work in progress for a web client using the traditional Sequence board design

**wip-client-app**: Work in progress for a mobile app version of Sequence using Flutter

Notes:
* API uptime monitoring and status page available here: [https://sequence.betteruptime.com](https://sequence.betteruptime.com).
* The API documentation is also available online in both [JSON](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/swagger.json) and [YAML](https://compsci.s3.eu-west-1.amazonaws.com/CM2020/swagger.yaml) formats.
* The API is implemented using AWS API Gateway and the endpoint is [https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod](https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod)
