var cron = require('node-cron');
const amqp = require('amqplib');

let connection = null;
let channel = null;
let isDeadMessageMoveProcessRunning = false;

// TODO: Remove duplicate declaration
const DEAD_LETTER_DELAY = 3000;
const RETRY_LIMIT = 3

async function init() {
    if(connection) {
        return
    }

    return amqp.connect('amqp://localhost').then(async conn => {
        connection = conn;

        console.log('rabbitmq connect success');
        channel = await connection.createChannel();
        
        // Consume the DL queue messages

        // Dead latter Exchange and its queue
        await channel.assertExchange(testExchangeDLX,'direct', {durable: true });
        const dlxQueueResult = await channel.assertQueue(testQueueDLX, {
            exclusive: false,
            durable: true
        });
        await channel.bindQueue(dlxQueueResult.queue, testExchangeDLX, testRoutingKeyDLX);

        return connection;
    })
}

async function moveDeadLetterMsg(connnection) {
    try {   
        const testQueueState = await channel.checkQueue(testQueueDLX)        
        if(testQueueState.messageCount == 0) {
            isDeadMessageMoveProcessRunning = false
            console.log("moveDeadLetterMsg returned")
            return
        }
        console.log("testQueueState", testQueueState)        

        if(isDeadMessageMoveProcessRunning) {
            console.log("🚀 isDeadMessageMoveProcessRunning", isDeadMessageMoveProcessRunning)            
            return
        }

        isDeadMessageMoveProcessRunning = true
        
        while(testQueueState.messageCount != 0) {
            console.log("While loop starts")
           
            const msg = await channel.get(testQueueDLX);
            if(!msg) {
                console.log("While loop breaks")
                break
            }            
            console.log(msg.content.toString())

            // Make sure it must be publish to the delay exchange.
            // Publishing to main exchange will create circular cycle without no delay which will down server in few minutes. 
            await channel.publish(testExchangeDelay, '', msg.content, {
                headers: {
                    "x-delay": DEAD_LETTER_DELAY, // As retry attempt started back, assign to default delay
                    "x-retry-limit": RETRY_LIMIT
                }
            })
            await channel.ack(msg)                   
        }
        isDeadMessageMoveProcessRunning = false
        console.log("<<>>> isDeadMessageMoveProcessRunning", isDeadMessageMoveProcessRunning)        
    }
    catch(err) {
        // In error, isDeadMessageMoveProcessRunning is set to false otherwise, it will lock the process
        isDeadMessageMoveProcessRunning = false
        console.log("err", err)
    }
}

function getDelayRetryInterval(retryCount) {
    const interval = Math.pow(2, retryCount - 1) * DELAY_DEFAULT
    console.log(`New interval ${interval}`)
    return interval
}

cron.schedule('*/5 * * * * *', async () => {
  console.log('running a task every 5 sec');
  await init()
  await moveDeadLetterMsg(connection);
});