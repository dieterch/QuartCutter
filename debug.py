import json
from webcutter2.dplex import PlexInterface
from webcutter2.dcut import CutterInterface
from pprint import pformat as pf

class MyEncoder(json.JSONEncoder):
    def default(self, o):
        return o.__dict__

fileserver = '192.168.15.10'
baseurl = 'http://192.168.15.10:32400'
token = '7YgcyPLqGVM-PVxq2QVo'

plex = PlexInterface(baseurl,token)
cutter = CutterInterface(fileserver)

pm = plex.server.library.section('Plex Recordings').recentlyAdded()[36]
#print(cutter._foldername(pm))
#print(cutter._filename(pm))
#print(cutter._pathname(pm))
#print(cutter._cutfilename(pm))
#print(cutter._cutname(pm))
#print(cutter._cutfile(pm))
m = plex.MovieData(pm)
#print(m)
#print(m.__repr__)
#print(json.dumps(m, cls=MyEncoder))
print(pf(cutter._movie_stats(m, "00:00:00", "00:30:00", False)))