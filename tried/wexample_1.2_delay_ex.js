const amqp = require('amqplib');
const uuid = require('uuid');

let connection = null;
const DELAY_DEFAULT = 1000;
const RETRY_LIMIT = 1

async function init() {
    return amqp.connect('amqp://localhost').then(conn => {
        connection = conn;

        console.log('rabbitmq connect success');

        return connection;
    })
}

async function producer(connnection) {
    const testExchange ='testEx';

    const ch = await connnection.createChannel();
    
    const msg = {
        id: uuid.v4(),
        payload: `Hi! I'm payload`,        
    }
    console.log('producer msg:', msg);
    await ch.publish(testExchange, '', new Buffer.from(JSON.stringify(msg)))
    ch.close();
}

 async function consumer(connnection) {
    const testExchange ='testEx';
    const testQueue ='testQu';

    const testExchangeDelay ='testExDelay';

    const testExchangeDLX ='testExDLX';
    const testRoutingKeyDLX ='testRoutingKeyDLX';
    const testQueueDLX ='testQueueDLX';

    const ch = await connnection.createChannel();

    // Main exchange and its queue
    await ch.assertExchange(testExchange,'direct', {durable: true });
    const mainQueueResult = await ch.assertQueue(testQueue, {
        exclusive: false,
        durable: true,
        deadLetterExchange: testExchangeDLX,
        deadLetterRoutingKey: testRoutingKeyDLX,
    });

    // Delayed exchange
    await ch.assertExchange(testExchangeDelay, "x-delayed-message", {
        autoDelete: false, 
        durable: true, 
        passive: true, //TODO: Check what it does
        arguments: {'x-delayed-type':  "direct"}
    })

    // Dead latter Exchange and its queue
    await ch.assertExchange(testExchangeDLX,'direct', {durable: true });
    const dlxQueueResult = await ch.assertQueue(testQueueDLX, {
        exclusive: false,
        durable: true
    });
    
    // Queue binding to the exchange
    await ch.bindQueue(mainQueueResult.queue, testExchange);
    await ch.bindQueue(mainQueueResult.queue, testExchangeDelay);
    await ch.bindQueue(dlxQueueResult.queue, testExchangeDLX, testRoutingKeyDLX);
    
    // Consume the msg
    await ch.consume(testQueue, async (msg) => {
        // console.log(' Buffer.from(msg)',  msg)
        console.log('testQueue consumer msg:', msg.content.toString());
        
        let processDone = false;
        if(processDone) {
            ch.ack(msg)
            return
        }
        
        // Below code is failure code for message process and then how handle that scenario

        // TODO: Specify the routing key(2nd parameter), to handle single delay exchange for multiple mail queue
        
        // Move message to DL queue if msg fails to process withing maximum defined attempt 
        let maxRetryLimit = msg.properties.headers['x-retry-limit']
        let retryCount = msg.fields.deliveryTag;
        console.log("maxRetryLimit", maxRetryLimit)
        console.log("retryCount", retryCount)
        if(retryCount >= maxRetryLimit) {
            // If allUpTo is truthy, all outstanding messages prior to and including the given message are rejected
            // If requeue is truthy, the server will try to put the message or messages back on the queue or queues from which they came.            
            ch.nack(message=msg, allUpTo=false, requeue=false)
            return
        }

        ch.ack(msg)
        
        let newDelay = getDelayRetryInterval(retryCount)
        console.log("newDelay", newDelay)
        await ch.publish(testExchangeDelay, '', msg.content, {
            headers: {
                "x-delay": newDelay,
                "x-retry-limit": RETRY_LIMIT
            }
        })
        
    }, {noAck: false });
}

function getDelayRetryInterval(retryCount) {
    const interval = Math.pow(2, retryCount - 1) * DELAY_DEFAULT
    console.log(`New interval ${interval}`)
    return interval
}


//Consumer news
init().then(async connection => {
    await consumer(connection)
    producer(connection)
});