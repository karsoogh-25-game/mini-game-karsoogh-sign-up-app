# mini-game-karsoogh-sign-up-app

docker stop $(docker ps -q)


docker start mysql_db_container redis_db_container app_container


docker-compose up -d --build mysql_db redis_db app

- docker exec -it mysql_db_container mysql -u ligauk_user -p ligauk_db

- docker exec -it mysql_db_container mysql -u root -p


runtime logs:

docker logs -f app_container

