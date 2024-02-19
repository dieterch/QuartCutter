from webcutter2.dcut import CutterInterface
import subprocess
clear = lambda: print("\033[H\033[J", end="")

import tomli
with open("config.toml", mode="rb") as fp:
    cfg = tomli.load(fp)
    
fileserver = cfg['fileserver']
baseurl = cfg['plexurl']
token = cfg['plextoken']

#clear()
cutter = CutterInterface(fileserver)
code = ''
try:
    code = cutter.umount()
except subprocess.CalledProcessError as err:
    print(code)
