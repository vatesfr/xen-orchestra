FROM ubuntu:xenial

# https://qastack.fr/programming/25899912/how-to-install-nvm-in-docker

RUN ls
RUN apt-get update
RUN apt-get install -y curl qemu-utils blktap-utils vmdk-stream-converter git
ENV NVM_DIR /usr/local/nvm
RUN mkdir -p /usr/local/nvm
RUN cd /usr/local/nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NODE_VERSION v17.0.1
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

RUN  npm install -g yarn

WORKDIR /xen-orchestra

ENTRYPOINT ["/xen-orchestra/docker/startup.sh"]

