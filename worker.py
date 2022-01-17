import time

from redis import Redis
from redis.exceptions import ConnectionError
from rq import Connection, Queue, Worker

from webcutter2.dcut import CutterInterface

fileserver = '192.168.15.10'
cutter = CutterInterface(fileserver)

redis_connection = Redis(host='localhost',port=6379,password='63nTa6UlGeRipER5HIlInTH5hoS3ckL4')

if __name__ == '__main__':
    for i in range(10):
        try:
            with Connection(redis_connection):
                worker = Worker(Queue('QuartCutter'))
                worker.work()
                break
        except (ConnectionError, ConnectionRefusedError) as err:
        #except Exception as err:
            print(str(err), f"... retry {i+1}/10 ...")
            time.sleep(5)
    print(f"giving up ... QuartCutter Worker Execution ended.")

#redis.exceptions.ConnectionError
