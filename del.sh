curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/testEx
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/testExDLX
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/queues/%2F/testQu
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/queues/%2F/testQueueDLX

curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/primary_exchange
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/delay_exchange
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/dead_letter_exchange
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/queues/%2F/primary_queue
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/queues/%2F/dead_letter_queue

curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/Test_MainExchange
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/Test_DeadLetterExchange
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/queues/%2F/Test_MainQueue
curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/queues/%2F/Test_DeadLetterQueue


curl -i -u guest:guest -H "content-type:application/json" \
    -XDELETE http://localhost:15672/api/exchanges/%2F/testExDelay