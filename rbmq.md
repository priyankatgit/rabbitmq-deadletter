## Basic terms & Understanding
### connections
    A connection (TCP) is a link between the client and the broker, that performs underlying networking tasks including initial authentication, IP resolution, and networking.
    
### channel
    Connections can multiplex over a single TCP connection, meaning that an application can open "lightweight connections" on a single connection. This "lightweight connection" is called a channel. Each connection can maintain a set of underlying channels.

    Many applications needs to have multiple connections to the broker, and instead of having many connections an application can reuse the connection, by instead, create and delete channels. Keeping many TCP connections open at the same time is not desired, as they consume system resources. The handshake process for a connection is also quite complex and requires at least 7 TCP packets or more if TLS is used.

    A channel acts as a virtual connection inside a TCP connection. A channel reuses a connection, forgoing the need to reauthorize and open a new TCP stream. Channels allow you to use resources more efficiently (more about this later in this article).

    Every AMQP protocol-related operation occurs over a channel.

### exchanges
    Publish are connected to the queue via exchanges. Publisher can never send the message to the queue directly but instead it sends message to the exchange and exchange route the messages to the queue based on exchange type and defined routing key to the exchange.

### router
    Used in while defining exchanges and it plays key role to route message to the queue 

### queue
    Holds the messages for the process.

## Types of exchanges
### Direct Exchange
A direct exchange delivers messages to queues based on a message routing key. The routing key is a message attribute added to the message header by the producer. Think of the routing key as an "address" that the exchange is using to decide how to route the message. A message goes to the queue(s) with the binding key that exactly matches the routing key of the message.

###  Topic Exchange
Topic exchange is similar to direct exchange, but the routing is done according to the routing pattern. Instead of using fixed routing key, it uses wildcards. Messages are routed to one or many queues based on a matching between a message routing key and pattern. The routing key must consist of list of words delimited by a period “.”.

### Fanout Exchange
A fanout exchange copies and routes a received message to all queues that are bound to it regardless of routing keys or patterns. The keys provided will simply be ignored.

Fanout exchanges can be useful when the same message needs to be sent to one or more queues with consumers who may process the same message in different ways.

### Headers Exchange
A headers exchange routes messages based on arguments containing headers and optional values. It uses the message header attributes for routing.

A special argument named “x-match”, added in the binding between exchange and queue, specifies if all headers must match or just one. The “x-match” property can have two different values: “any” or “all”,where “all” is the default value. A value of “all” means all header pairs (key, value) must match, while value of “any” means at least one of the header pairs must match.

### Default Exchange

The default exchange is a pre-declared direct exchange that has no name. It is usually referred by an empty string. If you use default exchange your message is delivered to the queue with a name equal to the routing key of the message. Every queue is automatically bound to the default exchange with a routing key which is the same as the queue name.

### Dead Letter Exchange

If there is no matching queue for the message, the message is dropped. RabbitMQ provides an AMQP extension known as the “Dead Letter Exchange”. This exchange which provides the functionality to capture messages that are not deliverable.