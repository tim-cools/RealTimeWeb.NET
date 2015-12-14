FROM microsoft/aspnet:1.0.0-rc1-update1

WORKDIR /home
RUN ["/usr/bin/nuget", "source", "add", "-Name", "deployment", "-Source", "https://ci.appveyor.com/nuget/realtimeweb-net"]
RUN echo {} > project.json
RUN ["dnu", "install", "Soloco.RealTimeWeb"]
RUN rm project.json
RUN cp -r /root/.dnx/packages/Soloco.RealTimeWeb/1.0.0/app/*.* .
RUN cp -r /root/.dnx/packages/Soloco.RealTimeWeb/1.0.0/wwwroot .
RUN cp -r /root/.dnx/packages/Soloco.RealTimeWeb/1.0.0/Views .
RUN dnu restore

EXPOSE 5001/tcp
ENTRYPOINT ["dnx", "-p", "project.json", "web"]
