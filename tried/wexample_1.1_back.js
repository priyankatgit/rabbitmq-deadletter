const amqp = require('amqplib');

let connection = null;

async function init() {
    return amqp.connect('amqp://localhost').then(conn => {
        connection = conn;

        console.log('rabbitmq connect success');

        return connection;
    })
}

async function producerDLX(connnection) {
    const testExchange ='testEx';
    const testQueue ='testQu';

    const ch = await connnection.createChannel();
    
    const msg ='hello world!';
    console.log('producer msg:', msg);
    // await ch.sendToQueue(testQueue, Buffer.from(msg), {
    //     // expiration: '20000'
    // });
    await ch.publish(testExchange, '', Buffer.from(msg),)
    ch.close();
}

 async function consumerDLX(connnection) {
    const testExchange ='testEx';
    const testQueue ='testQu';

    const testExchangeDLX ='testExDLX';
    const testRoutingKeyDLX ='testRoutingKeyDLX';
    const testQueueDLX ='testQueueDLX';

    const ch = await connnection.createChannel();

    // Main queue
    await ch.assertExchange(testExchange,'direct', {durable: true });
    const mainQueueResult = await ch.assertQueue(testQueue, {
        exclusive: false,
        durable: true,
        deadLetterExchange: testExchangeDLX,
        deadLetterRoutingKey: testRoutingKeyDLX,
    });
    await ch.bindQueue(mainQueueResult.queue, testExchange);

    // DLX queue
    await ch.assertExchange(testExchangeDLX,'direct', {durable: true });
    const dlxQueueResult = await ch.assertQueue(testQueueDLX, {
        exclusive: false,
        durable: true
    });
    await ch.bindQueue(dlxQueueResult.queue, testExchangeDLX, testRoutingKeyDLX);

    await ch.consume(dlxQueueResult.queue, msg => {
        console.log(dlxQueueResult.queue+' consumer msg:', msg.content.toString());
        // ch.ack(msg)
    }, {noAck: false });
    
    // Consume the msg
    await ch.consume(testQueue, msg => {
        console.log('testQueue consumer msg:', msg.content.toString());
        
        // If allUpTo is truthy, all outstanding messages prior to and including the given message are rejected
        // If requeue is truthy, the server will try to put the message or messages back on the queue or queues from which they came.
        ch.nack(message=msg, allUpTo=false, requeue=false)
        //ch.ack(msg)
    }, {noAck: false });
}

//Consumer news
init().then(async connection => {
    await consumerDLX(connection)
    producerDLX(connection)
});