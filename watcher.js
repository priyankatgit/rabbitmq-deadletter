const {
    rbmqPool,
    createDeadLetterExchangeAndQueue,
    DELAY_EXCHANGE,
    DEAD_LETTER_QUEUE,
    DEAD_LETTER_DELAY,
    RETRY_LIMIT,
  } = require("./util.js");
var cron = require('node-cron');

let channel = null;
let isDeadMessageMoveProcessRunning = false;


cron.schedule('*/5 * * * * *', async () => {
    console.log('running a task every 5 sec');
    
    const connection = await rbmqPool();
    if(channel == null) {
        channel = await connection.createChannel();
        await createDeadLetterExchangeAndQueue(channel);
    }

    await moveDeadLetterMsg(channel);
});


async function moveDeadLetterMsg(channel) {
    try {   
        const deadLetterQueueState = await channel.checkQueue(DEAD_LETTER_QUEUE)        
        if(deadLetterQueueState.messageCount == 0) {
            isDeadMessageMoveProcessRunning = false
            // console.log("moveDeadLetterMsg returned")
            return
        }

        console.log("deadLetterQueueState", deadLetterQueueState)        

        if(isDeadMessageMoveProcessRunning) {
            // console.log("🚀 isDeadMessageMoveProcessRunning", isDeadMessageMoveProcessRunning)            
            return
        }

        isDeadMessageMoveProcessRunning = true
        
        while(deadLetterQueueState.messageCount != 0) {
            // console.log("While loop starts")
            
            const msg = await channel.get(DEAD_LETTER_QUEUE);
            if(!msg) {
                // console.log("While loop breaks")
                break
            }            
            
            // Make sure it must be publish to the delay exchange.
            // Publishing to main exchange will create circular cycle without no delay which will down server in few minutes. 
            await channel.publish(DELAY_EXCHANGE, '', msg.content, {
                headers: {
                    "x-delay": DEAD_LETTER_DELAY, // As retry attempt started back, assign to default delay
                    "x-retry-limit": RETRY_LIMIT
                }
            })
            console.log("Message moved: ",msg.content.toString())

            // Ack the message to remove from the dead letter queue
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
