Run me!
`sudo docker compose up --build`


## .env file
The docker-compose.yml uses an .env variable to override the environment variables.
```
- NUUCAST_API_URL=${NUUCAST_API_URL:-http://localhost:80}
- NUUWATCH_API_URL=${NUUWATCH_API_URL:-http://localhost:8080}
```

This can be useful if your server has a name like `server.home.arpa`
Then you can create a `.env` file in the same folder this readme file is, like this if your server is called `server`
```
NUUCAST_API_URL=http://server.home.arpa:80
NUUWATCH_API_URL=http://server.home.arpa:8080
```