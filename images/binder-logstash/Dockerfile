FROM ubuntu:latest

MAINTAINER Andrew Osheroff <andrewosh@gmail.com>

USER root
RUN apt-get update && sudo apt-get install -y wget openjdk-7-jre &&\
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*tmp
RUN wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
RUN echo "deb http://packages.elastic.co/logstash/2.1/debian stable main" | sudo tee -a /etc/apt/sources.list
RUN apt-get update && sudo apt-get install -y logstash curl &&\
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*tmp

RUN mkdir -p /usr/share/logstash/config
RUN chown -R logstash:logstash /usr/share/logstash/config

USER logstash

RUN echo "blablaahd"

RUN /opt/logstash/bin/plugin install logstash-input-tcp
RUN /opt/logstash/bin/plugin install logstash-output-elasticsearch
RUN /opt/logstash/bin/plugin install logstash-output-websocket_topics

CMD ["/opt/logstash/bin/logstash", "-f", "/usr/share/logstash/config/*.conf"]











