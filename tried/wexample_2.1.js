const amqp = require('amqplib');

async function init() {
    return amqp.connect('amqp://localhost').then(conn => {
        connection = conn;

        console.log('rabbitmq connect success');

        return connection;
    })
}

async function execute() {
    // Ask the connection manager for a ChannelWrapper.  Specify a setup function to
    // run every time we reconnect to the broker.
    const connection = await init()

    const channel = await connection.createChannel();
    
    // A channel is your ongoing connection to RabbitMQ.
    // All commands go through your channel.
    channel.prefetch(100);
        
    // Setup EXCHANGES - which are hubs you PUBLISH to that dispatch MESSAGES to QUEUES
    await channel.assertExchange('Test_MainExchange', 'topic', {
        durable: true,
        autoDelete: true,
        noAck: false
    }),

    await channel.assertExchange('Test_DeadLetterExchange', 'topic', {
        durable: true,
        autoDelete: true,
        maxLength: 1000,
        noAck: false
    })
    
    // Setup QUEUES - which are delegated MESSAGES by EXCHANGES.
    // The MESSAGES then need to be CONSUMED.
    await channel.assertQueue(
        'Test_MainQueue',
        options = {
            durable: true,
            exclusive: false,
            // messageTtl: 1000*60*60*1,
            deadLetterExchange: 'Test_DeadLetterExchange'
        }
    ),
    
    await channel.assertQueue('Test_DeadLetterQueue',
        options = {
            durable: true,
            exclusive: false
        }
    )
    
    // This glues the QUEUES and EXCHANGES together
    // The last parameter is a routing key. A hash/pound just means: give me all messages in the exchange.
    await channel.bindQueue('Test_MainQueue', 'Test_MainExchange', '#'),
    await channel.bindQueue('Test_DeadLetterQueue', 'Test_DeadLetterExchange', '#')
    
    // Setup our CONSUMERS
    // They pick MESSAGES off of QUEUES and do something with them (either ack or nack them)
    await channel.consume('Test_MainQueue', (msg) => {
        const stringifiedContent = msg.content ? msg.content.toString() : '{}';
        console.log('Test_MainQueue::CONSUME ' + stringifiedContent);

        const messageData = JSON.parse(stringifiedContent);
        if (messageData.value === 0) {
            console.log('Test_MainQueue::REJECT ' + stringifiedContent);
            // the 'false' param at the very end means, don't retry! dead letter this instead!
            return channel.nack(msg, true, false);
        }
        return channel.ack(msg);
    })
    
    channel.consume('Test_DeadLetterQueue', (msg) => {
        const stringifiedContent = msg.content ? msg.content.toString() : '{}';
        console.log('');
        console.log('Test_DeadLetterQueue::CONSUME ' + stringifiedContent);
        console.log('');
    });
    
    // setInterval(function () {
        
    // }, 2000);

    const messageData = {
        text: 'Dead letter if 0 ==>',
        //value: Math.floor(Math.random()*5)
        value:0
    };
    const stringifiedMessage = JSON.stringify(messageData);

    // Publish message to exchange
    if (channel.publish('Test_MainExchange', '', new Buffer(stringifiedMessage))) {
        console.log(`Sent ${stringifiedMessage}`);
    } else {
        console.log(`Failed to send ${stringifiedMessage}`);
    };
}

execute()