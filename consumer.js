const {
  rbmqPool,
  createPrimaryExchangeAndQueue,
  createDelayExchange,
  createDeadLetterExchangeAndQueue,
  getDelayRetryInterval,
  PRIMARY_QUEUE,
  DELAY_EXCHANGE,
  DELAY_DEFAULT,
  RETRY_LIMIT
} = require("./util.js");

const fetch = require("node-fetch")

const execute = async () => {

    const connection = await rbmqPool();
    const channel = await connection.createChannel();

    // Process max 10 messages at the same time 
    channel.prefetch(10); 
    
    await createPrimaryExchangeAndQueue(channel)
    await createDelayExchange(channel)
    await createDeadLetterExchangeAndQueue(channel)

    // Consume the msg
    await channel.consume(PRIMARY_QUEUE, async (msg) => {
        console.log('PRIMARY_QUEUE consumer received:', msg.content.toString());

        // To test failed message scenario, stop the server and check
        try {
            const res = await fetch("http://localhost:8000/")
            const data = await res.text()
            
            channel.ack(msg)
        }
        catch(err) {
            moveMessageToDelayExchange(channel, msg);
            console.log("Server is down. Message is moved to delay exchange.")
        }
        
    }, {noAck: false });

}

async function moveMessageToDelayExchange(channel, msg) {
    // TODO: Specify the routing key(2nd parameter), to handle single delay exchange for multiple mail queue
    
    // Move message to DL queue if msg fails to process withing maximum defined attempt 
    let maxRetryLimit = msg.properties.headers['x-retry-limit']
    let retryCount = msg.fields.deliveryTag;
    
    console.log("")
    console.log(msg.content.toString())
    console.log("Max retry limit", maxRetryLimit)
    console.log("Retry count", retryCount)
    
    // Move msg to dead letter after max retry happened
    if(retryCount >= maxRetryLimit) {
        // If allUpTo is truthy, all outstanding messages prior to and including the given message are rejected
        // If requeue is truthy, the server will try to put the message or messages back on the queue or queues from which they came.            
        channel.nack(message=msg, allUpTo=false, requeue=false)
        return
    }
    
    // Ack the msg to remove it from primary queue
    channel.ack(msg)
    
    // Transfer msg to delay exchange so it will retry message based on max retry count
    let newDelay = getDelayRetryInterval(retryCount, DELAY_DEFAULT)
    console.log(`New delay time ${newDelay} ms`)
    await channel.publish(DELAY_EXCHANGE, '', msg.content, {
        headers: {
            "x-delay": newDelay,
            "x-retry-limit": RETRY_LIMIT
        }
    })
}

execute()