const rabbitmq = require('./rbmq');

console.log("--",rabbitmq)

async function producerDLX(connnection) {
    const testExchange ='testEx';
    const testQueue ='testQu';
    const testExchangeDLX ='testExDLX';
    const testRoutingKeyDLX ='testRoutingKeyDLX';

    const ch = await connnection.createChannel();
    await ch.assertExchange(testExchange,'direct', {durable: true });
    const queueResult = await ch.assertQueue(testQueue, {
        exclusive: false,
        deadLetterExchange: testExchangeDLX,
        deadLetterRoutingKey: testRoutingKeyDLX,
    });
    await ch.bindQueue(queueResult.queue, testExchange);
    const msg ='hello world!';
    console.log('producer msg:', msg);

    await ch.sendToQueue(queueResult.queue, Buffer.from(msg));

    ch.close();
}

rabbitmq.init().then(connection => producerDLX(connection));