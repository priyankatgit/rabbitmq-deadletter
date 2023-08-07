const {
  rbmqPool,
  createPrimaryExchangeAndQueue,
  PRIMARY_EXCHANGE,
} = require("./util.js");
const uuid = require("uuid");

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(
  `Enter any number between 1 to 1M to produce random message:`,
  async (number) => {
    readline.close();

    number = parseInt(number);
    if (number > 1000000) {
      console.log("Not tested for 1M messages producer");
      return;
    }

    const connection = await rbmqPool();
    const channel = await connection.createChannel();

    await createPrimaryExchangeAndQueue(channel);

    for (let i = 0; i < number; i++) {
      const msg = {
        id: uuid.v4(),
        index: i,
      };
      console.log("producer msg:", msg);
      await channel.publish(
        PRIMARY_EXCHANGE,
        "",
        new Buffer.from(JSON.stringify(msg))
      );
    }
    channel.close();
  }
);
