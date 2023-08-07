const amqp = require('amqplib');
const uuid = require('uuid');

const PRIMARY_EXCHANGE ='primary_exchange';
const PRIMARY_QUEUE ='primary_queue';

const DELAY_EXCHANGE ='delay_exchange';

const DEAD_LETTER_EXCHANGE ='dead_letter_exchange';
const DEAD_LETTER_ROUTING ='dead_letter_routing';
const DEAD_LETTER_QUEUE ='dead_letter_queue';

const DELAY_DEFAULT = 1000; 
const RETRY_LIMIT = 3
const DEAD_LETTER_DELAY = 3000;

let connection = null;

const rbmqPool = () => {
    if(connection) {
        return new Promise(resolve => resolve(connection))
    }

    return amqp.connect('amqp://localhost').then(conn => {
        connection = conn;

        console.log('rabbitmq connect success');

        return connection;
    })
}

const createPrimaryExchangeAndQueue = async (channel) => {
    await channel.assertExchange(PRIMARY_EXCHANGE,'direct', {durable: true });
    await channel.assertQueue(PRIMARY_QUEUE, {
        exclusive: false,
        durable: true,
        deadLetterExchange: DEAD_LETTER_EXCHANGE,
        deadLetterRoutingKey: DEAD_LETTER_ROUTING,
    });
    await channel.bindQueue(PRIMARY_QUEUE, PRIMARY_EXCHANGE);
}

const createDelayExchange = async (channel) => {
    await channel.assertExchange(DELAY_EXCHANGE, "x-delayed-message", {
        autoDelete: false, 
        durable: true, 
        passive: true, //TODO: Check what it does
        arguments: {'x-delayed-type':  "direct"}
    })
    await channel.bindQueue(PRIMARY_QUEUE, DELAY_EXCHANGE);
}

const createDeadLetterExchangeAndQueue = async (channel) => {
    await channel.assertExchange(DEAD_LETTER_EXCHANGE,'direct', {durable: true });
    await channel.assertQueue(DEAD_LETTER_QUEUE, {
        exclusive: false,
        durable: true
    });
    await channel.bindQueue(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, DEAD_LETTER_ROUTING);
}

const getDelayRetryInterval = (retryCount, defaultDelay) => {
    const interval = Math.pow(2, retryCount - 1) * defaultDelay
    console.log(`Next message will be retried after ${interval/1000} sec`)
    return interval
}

module.exports = { 
    rbmqPool, 
    getDelayRetryInterval, 
    createPrimaryExchangeAndQueue,
    createDelayExchange,
    createDeadLetterExchangeAndQueue,
    PRIMARY_EXCHANGE,
    PRIMARY_QUEUE,
    DELAY_EXCHANGE,
    DEAD_LETTER_QUEUE,
    DEAD_LETTER_DELAY,
    DELAY_DEFAULT,
    RETRY_LIMIT,
}