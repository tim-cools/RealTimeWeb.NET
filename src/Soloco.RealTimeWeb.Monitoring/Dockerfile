FROM soloco/aspnet-withdependencies:1.0.0-rc1-update1

COPY . /app
WORKDIR /app
RUN ["dnu", "restore"]

EXPOSE 5800
ENTRYPOINT ["dnx", "-p", "project.json", "web"]