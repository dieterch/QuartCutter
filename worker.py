from redis import Redis
from rq import Connection, Queue, Worker
from webcutter2.dcut import CutterInterface

fileserver = '192.168.15.10'
cutter = CutterInterface(fileserver)

redis_connection = Redis(host='localhost',port=6379,password='63nTa6UlGeRipER5HIlInTH5hoS3ckL4')

if __name__ == '__main__':
    with Connection(redis_connection):
        worker = Worker(Queue('QuartCutter'))
        worker.work()