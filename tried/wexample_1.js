const amqp = require('amqplib');

let connection = null;

function init() {
    return amqp.connect('amqp://localhost').then(conn => {
        connection = conn;

        console.log('rabbitmq connect success');

        return connection;
    })
}

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
    await ch.sendToQueue(queueResult.queue, Buffer.from(msg), {
        expiration: '10000'
    });

    ch.close();
}

 async function consumerDLX(connnection) {
    const testExchangeDLX ='testExDLX';
    const testRoutingKeyDLX ='testRoutingKeyDLX';
    const testQueueDLX ='testQueueDLX';

    const ch = await connnection.createChannel();
    await ch.assertExchange(testExchangeDLX,'direct', {durable: true });
    const queueResult = await ch.assertQueue(testQueueDLX, {
        exclusive: false,
    });
    await ch.bindQueue(queueResult.queue, testExchangeDLX, testRoutingKeyDLX);
    await ch.consume(queueResult.queue, msg => {
        console.log('consumer msg:', msg.content.toString());
    }, {noAck: true });
}

//Consumer news
init().then(connection => {
    producerDLX(connection)
    consumerDLX(connection)
});