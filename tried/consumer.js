const rabbitmq = require('./rbmq');

async function consumerDLX(connnection) {
    const testExchangeDLX ='testExDLX';
    const testRoutingKeyDLX ='testRoutingKeyDLX';
    const testQueueDLX ='testQueueDLX';
    const testQueue ='testQu';

    const ch = await connnection.createChannel();
    
    await ch.assertExchange(testExchangeDLX,'direct', {durable: true });
    //TODO: Fix it
    // await ch.assertExchange(exchange="testExchangeDLX",
    //                      exchange_type="x-delayed-message",
                            // durable="true",
    //                      arguments={"x-delayed-type": "direct"})

    const queueResult = await ch.assertQueue(testQueueDLX, {
        exclusive: false,
    });
    await ch.bindQueue(queueResult.queue, testExchangeDLX, testRoutingKeyDLX);
    await ch.consume(queueResult.queue, async msg => {
        
        console.log('consumer msg:', msg.content.toString());
        await channel.nack(msg);

    }, {noAck: false });
}

rabbitmq.init().then(connection => consumerDLX(connection));