from webcutter2.dcut import CutterInterface
import subprocess
clear = lambda: print("\033[H\033[J", end="")


fileserver = '192.168.15.10'
baseurl = 'http://192.168.15.10:32400'
token = '7YgcyPLqGVM-PVxq2QVo'

#clear()
cutter = CutterInterface(fileserver)
code = ''
try:
    code = cutter.umount()
except subprocess.CalledProcessError as err:
    print(code)
